from datetime import timedelta

from django.db import models
from django.db.models import Exists, OuterRef
from django.db.models import Avg, Case, Count, DecimalField, Sum, Value, When
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import ProductFilter
from .models import AdminLog, Category, Comment, CommentReaction, Dispute, Favorite, Friendship, Message, Notification, Offer, Product, Review, User
from .permissions import IsAdminUserOrReadOnly, IsSellerOrReadOnly, MessageOwnerPermission
from .throttles import CommentRateThrottle, MessageRateThrottle, UploadRateThrottle
from .serializers import (
	AdminLogSerializer,
	AdminDisputeSerializer,
	CategorySerializer,
	CommentSerializer,
	DisputeSerializer,
	FavoriteSerializer,
	FriendshipSerializer,
	MessageSerializer,
	NotificationSerializer,
	OfferSerializer,
	ProductSerializer,
	ReviewSerializer,
	UserAdminSerializer,
	UserPublicSerializer,
)


class HealthCheckView(APIView):
	authentication_classes: list = []
	permission_classes: list = []

	def get(self, request):
		return Response({"status": "ok", "timestamp": timezone.now()})


class CategoryViewSet(viewsets.ModelViewSet):
	queryset = Category.objects.all()
	serializer_class = CategorySerializer
	permission_classes = [IsAdminUserOrReadOnly]
	search_fields = ["name", "slug"]
	ordering_fields = ["name", "created_at"]
	ordering = ["name"]


class ProductViewSet(viewsets.ModelViewSet):
	queryset = Product.objects.select_related("seller", "category")
	serializer_class = ProductSerializer
	permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsSellerOrReadOnly]
	parser_classes = [MultiPartParser, FormParser, JSONParser]
	filterset_class = ProductFilter
	search_fields = ["title", "description", "brand", "location"]
	ordering_fields = ["price", "created_at", "view_count"]
	ordering = ["-created_at"]

	def get_throttles(self):
		"""Apply upload throttle only for create/update actions"""
		if self.action in ["create", "update", "partial_update"]:
			return [UploadRateThrottle()]
		return super().get_throttles()

	def perform_create(self, serializer):
		# Auto-approve products so they appear immediately on friends' feeds
		serializer.save(
			seller=self.request.user,
			moderation_status=Product.ModerationStatus.APPROVED
		)

	def get_queryset(self):
		queryset = super().get_queryset()
		if self.request.user.is_authenticated:
			favorite_exists = Favorite.objects.filter(
				user=self.request.user, product=OuterRef("pk")
			)
			return queryset.annotate(is_favorite=Exists(favorite_exists))
		return queryset.annotate(is_favorite=models.Value(False, output_field=models.BooleanField()))

	def _log_product_action(self, product, action, reason=""):
		AdminLog.objects.create(
			admin=self.request.user,
			action=action,
			target_product=product,
			reason=reason,
		)

	@action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
	def friends_feed(self, request):
		"""Get products from friends only - shows ALL active products regardless of moderation status"""
		user = request.user
		
		# Get list of accepted friends
		friend_ids = []
		friendships = Friendship.objects.filter(
			models.Q(requester=user, status=Friendship.Status.ACCEPTED) |
			models.Q(receiver=user, status=Friendship.Status.ACCEPTED)
		).select_related('requester', 'receiver')
		
		for friendship in friendships:
			friend = friendship.receiver if friendship.requester == user else friendship.requester
			friend_ids.append(friend.id)
		
		# Get ALL active products from friends (no moderation check)
		products = Product.objects.filter(
			seller_id__in=friend_ids,
			is_active=True
		).select_related('seller', 'category').order_by('-created_at')
		
		# Add is_favorite annotation
		favorite_exists = Favorite.objects.filter(
			user=user, product=OuterRef("pk")
		)
		products = products.annotate(is_favorite=Exists(favorite_exists))
		
		serializer = self.get_serializer(products, many=True)
		return Response({"results": serializer.data})

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
	def approve(self, request, pk=None):
		product = self.get_object()
		product.moderation_status = Product.ModerationStatus.APPROVED
		product.moderation_reason = ""
		product.save(update_fields=["moderation_status", "moderation_reason"])
		self._log_product_action(product, AdminLog.Action.PRODUCT_APPROVED)
		return Response({"status": "approved"})

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
	def reject(self, request, pk=None):
		product = self.get_object()
		reason = request.data.get("reason", "")
		product.moderation_status = Product.ModerationStatus.REJECTED
		product.moderation_reason = reason
		product.save(update_fields=["moderation_status", "moderation_reason"])
		self._log_product_action(product, AdminLog.Action.PRODUCT_REJECTED, reason)
		return Response({"status": "rejected", "reason": reason})

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
	def flag(self, request, pk=None):
		product = self.get_object()
		reason = request.data.get("reason", "")
		product.moderation_status = Product.ModerationStatus.FLAGGED
		product.moderation_reason = reason
		product.save(update_fields=["moderation_status", "moderation_reason"])
		self._log_product_action(product, AdminLog.Action.PRODUCT_FLAGGED, reason)
		return Response({"status": "flagged", "reason": reason})

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
	def favorite(self, request, pk=None):
		product = self.get_object()
		favorite, created = Favorite.objects.get_or_create(
			user=request.user, product=product
		)
		if not created:
			favorite.delete()
			return Response({"status": "removed"})
		return Response({"status": "added"})

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
	def checkout(self, request, pk=None):
		"""
		Atomic checkout endpoint to purchase a listing.
		Prevents double-purchase / race conditions using select_for_update.
		"""
		from django.db import transaction as db_transaction
		from .models import Transaction

		# Atomic transaction block with SELECT FOR UPDATE
		with db_transaction.atomic():
			# Obtain lock on the product row
			product = Product.objects.select_for_update().get(pk=pk)

			if not product.is_active:
				raise ValidationError("This product is no longer available.")

			if product.seller == request.user:
				raise ValidationError("You cannot buy your own product.")

			if product.moderation_status != Product.ModerationStatus.APPROVED:
				raise ValidationError("This product is not available for purchase.")

			# Mark product as sold/inactive
			product.is_active = False
			product.save(update_fields=["is_active", "updated_at"])

			# Create a completed transaction record
			txn = Transaction.objects.create(
				buyer=request.user,
				seller=product.seller,
				product=product,
				final_price=product.price,
				status=Transaction.Status.COMPLETED,
				completed_at=timezone.now()
			)

			# Increment seller's total_sales safely
			seller = product.seller
			seller.total_sales = models.F("total_sales") + 1
			seller.save(update_fields=["total_sales"])

			# Notify seller
			Notification.objects.create(
				user=product.seller,
				notification_type=Notification.Type.PAYMENT,
				title="Product Sold!",
				message=f"Congratulations! Your product '{product.title}' has been purchased by {request.user.username}.",
				link=f"/products/{product.id}",
				related_product=product,
				related_user=request.user
			)

			# Notify buyer
			Notification.objects.create(
				user=request.user,
				notification_type=Notification.Type.PAYMENT,
				title="Purchase Successful",
				message=f"You have successfully purchased '{product.title}' from {product.seller.username}.",
				link=f"/products/{product.id}",
				related_product=product,
				related_user=product.seller
			)

		return Response({
			"status": "success",
			"transaction_id": txn.id,
			"final_price": txn.final_price
		})


class MessageViewSet(viewsets.ModelViewSet):
	serializer_class = MessageSerializer
	permission_classes = [permissions.IsAuthenticated, MessageOwnerPermission]
	throttle_classes = [MessageRateThrottle]  # Rate limit messages
	filterset_fields = ["thread_id", "product", "recipient", "message_type"]
	ordering_fields = ["created_at"]
	ordering = ["-created_at"]

	def get_throttles(self):
		"""Apply message throttle only for write operations (create), not read (list/retrieve)"""
		if self.action in ["create"]:
			return [MessageRateThrottle()]
		return super().get_throttles()

	def get_queryset(self):
		user = self.request.user
		return Message.objects.select_related("sender", "recipient", "product").filter(
			models.Q(sender=user) | models.Q(recipient=user)
		)

	def perform_create(self, serializer):
		recipient = serializer.validated_data.get("recipient")
		sender = self.request.user
		
		if recipient == sender:
			raise ValidationError({"recipient": "Cannot message yourself"})
		
		product = serializer.validated_data.get("product")
		
		# Find existing thread between these two users (matching product if provided, or product-less if general message)
		if product:
			existing_thread = Message.objects.filter(
				(models.Q(sender=sender, recipient=recipient) | models.Q(sender=recipient, recipient=sender)),
				product=product
			).first()
		else:
			existing_thread = Message.objects.filter(
				(models.Q(sender=sender, recipient=recipient) | models.Q(sender=recipient, recipient=sender)),
				product__isnull=True
			).first()
		
		# Use existing thread_id or let the model generate a new one
		if existing_thread:
			message = serializer.save(sender=sender, thread_id=existing_thread.thread_id)
		else:
			message = serializer.save(sender=sender)
		
		# Create notification for message recipient
		product = serializer.validated_data.get("product")
		if product:
			notification_title = "New Message About Your Listing"
			notification_message = f"{sender.display_name or sender.username} messaged you about {product.title}"
			notification_link = "/messages"
		else:
			notification_title = "New Message"
			notification_message = f"{sender.display_name or sender.username} sent you a message"
			notification_link = "/messages"
		
		Notification.objects.create(
			user=recipient,
			notification_type=Notification.Type.MESSAGE,
			title=notification_title,
			message=notification_message,
			link=notification_link,
		)
	
	def get_serializer_context(self):
		"""Add request to serializer context for validation"""
		context = super().get_serializer_context()
		context['request'] = self.request
		return context

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
	def mark_read(self, request, pk=None):
		message = self.get_object()
		if message.recipient != request.user:
			return Response({"detail": "Forbidden"}, status=403)
		message.is_read = True
		message.read_at = timezone.now()  # Set read timestamp
		message.save(update_fields=["is_read", "read_at"])
		return Response({"status": "read", "read_at": message.read_at})


class AdminLogViewSet(viewsets.ReadOnlyModelViewSet):
	queryset = AdminLog.objects.select_related("admin", "target_user", "target_product")
	serializer_class = AdminLogSerializer
	permission_classes = [permissions.IsAdminUser]


class FavoriteViewSet(viewsets.ReadOnlyModelViewSet):
	serializer_class = FavoriteSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return Favorite.objects.select_related("product", "product__seller").filter(
			user=self.request.user
		)


class OfferViewSet(viewsets.ModelViewSet):
	serializer_class = OfferSerializer
	permission_classes = [permissions.IsAuthenticated]
	filterset_fields = ["status", "product"]
	ordering_fields = ["created_at", "proposed_price"]
	ordering = ["-created_at"]

	def get_queryset(self):
		user = self.request.user
		return Offer.objects.select_related("buyer", "product", "product__seller").filter(
			models.Q(buyer=user) | models.Q(product__seller=user)
		)

	def perform_create(self, serializer):
		product = serializer.validated_data.get("product")
		if product and product.seller == self.request.user:
			raise ValidationError("Cannot make an offer on your own listing")
		serializer.save(buyer=self.request.user)

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
	def respond(self, request, pk=None):
		offer = self.get_object()
		if offer.product.seller != request.user:
			return Response({"detail": "Forbidden"}, status=403)
		status_value = request.data.get("status")
		counter_price = request.data.get("counter_price")
		if status_value not in Offer.Status.values:
			return Response({"detail": "Invalid status"}, status=400)
		offer.status = status_value
		if status_value == Offer.Status.COUNTER and counter_price:
			offer.counter_price = counter_price
		offer.save(update_fields=["status", "counter_price", "updated_at"])
		log_action_map = {
			Offer.Status.ACCEPTED: AdminLog.Action.OFFER_ACCEPTED,
			Offer.Status.REJECTED: AdminLog.Action.OFFER_REJECTED,
			Offer.Status.COUNTER: AdminLog.Action.OFFER_COUNTERED,
		}
		if status_value in log_action_map:
			AdminLog.objects.create(
				admin=request.user,
				action=log_action_map[status_value],
				target_user=offer.buyer,
				target_product=offer.product,
				reason=str(counter_price or ""),
			)
		return Response({"status": offer.status, "counter_price": offer.counter_price})


class DisputeViewSet(viewsets.ModelViewSet):
	serializer_class = DisputeSerializer
	permission_classes = [permissions.IsAuthenticated]
	filterset_fields = ["status", "target_user", "target_product"]
	ordering_fields = ["created_at"]
	ordering = ["-created_at"]

	def get_queryset(self):
		return Dispute.objects.select_related(
			"reporter", "target_user", "target_product"
		).filter(reporter=self.request.user)

	def perform_create(self, serializer):
		target_user = serializer.validated_data.get("target_user")
		if target_user and target_user == self.request.user:
			raise ValidationError("Cannot dispute yourself")
		serializer.save(reporter=self.request.user)


class AdminDisputeViewSet(viewsets.ModelViewSet):
	queryset = Dispute.objects.select_related(
		"reporter", "target_user", "target_product"
	)
	serializer_class = AdminDisputeSerializer
	permission_classes = [permissions.IsAdminUser]
	filterset_fields = ["status", "target_user", "target_product"]
	ordering_fields = ["created_at"]
	ordering = ["-created_at"]

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
	def arbitrate(self, request, pk=None):
		dispute = self.get_object()
		status_value = request.data.get("status", Dispute.Status.UNDER_REVIEW)
		resolution_notes = request.data.get("resolution_notes", "")
		if status_value not in Dispute.Status.values:
			return Response({"detail": "Invalid status"}, status=400)
		dispute.status = status_value
		dispute.resolution_notes = resolution_notes
		dispute.save(update_fields=["status", "resolution_notes", "updated_at"])
		AdminLog.objects.create(
			admin=request.user,
			action=AdminLog.Action.DISPUTE_ARBITRATED,
			target_user=dispute.target_user,
			target_product=dispute.target_product,
			reason=resolution_notes,
		)
		return Response({"status": dispute.status})


class AdminDashboardStatsView(APIView):
	permission_classes = [permissions.IsAdminUser]

	def get(self, request):
		accepted_offers = Offer.objects.filter(status=Offer.Status.ACCEPTED)
		total_sales = accepted_offers.aggregate(
			total=Coalesce(
				Sum(
					Case(
						When(counter_price__isnull=False, then="counter_price"),
						default="proposed_price",
						output_field=DecimalField(max_digits=12, decimal_places=2),
					)
				),
				Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
			)
		)["total"]

		sold_listing_count = (
			accepted_offers.values("product_id").distinct().count()
		)
		active_listing_count = Product.objects.filter(is_active=True).count()

		active_disputes = Dispute.objects.filter(
			status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]
		).count()
		resolved_disputes = Dispute.objects.filter(status=Dispute.Status.RESOLVED).count()

		since = timezone.now() - timedelta(days=30)
		total_users = User.objects.count()
		new_listings = Product.objects.filter(created_at__gte=since).count()

		return Response(
			{
				"total_sales": total_sales,
				"active_listings": active_listing_count,
				"sold_listings": sold_listing_count,
				"active_disputes": active_disputes,
				"resolved_disputes": resolved_disputes,
				"total_users": total_users,
				"new_listings_last_30_days": new_listings,
			}
		)


class AdminTrendingView(APIView):
	permission_classes = [permissions.IsAdminUser]

	def get(self, request):
		top_categories = (
			Offer.objects.filter(status=Offer.Status.ACCEPTED)
			.values("product__category__name")
			.annotate(total=Count("id"))
			.order_by("-total")[:5]
		)
		top_locations = (
			Product.objects.exclude(location="")
			.values("location")
			.annotate(total=Count("id"))
			.order_by("-total")[:5]
		)

		return Response(
			{
				"top_categories": list(top_categories),
				"top_locations": list(top_locations),
			}
		)


class UserViewSet(viewsets.ModelViewSet):
	queryset = User.objects.all()
	serializer_class = UserAdminSerializer
	permission_classes = [permissions.IsAdminUser]
	filterset_fields = ["is_seller", "is_verified_seller", "is_suspended", "is_active"]
	search_fields = ["username", "email", "display_name"]
	ordering_fields = ["date_joined", "username"]
	ordering = ["-date_joined"]
	
	def get_permissions(self):
		"""Allow public access to search endpoint"""
		if self.action == 'search':
			return [permissions.AllowAny()]
		return super().get_permissions()
	
	def get_serializer_class(self):
		"""Use public serializer for search endpoint"""
		if self.action == 'search':
			return UserPublicSerializer
		return UserAdminSerializer
	
	@action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
	def search(self, request):
		"""Global search for users"""
		query = request.query_params.get("q", "").strip()
		if not query or len(query) < 2:
			return Response({"results": []})
		
		# Search in username and display_name
		users = User.objects.filter(
			models.Q(username__icontains=query) |
			models.Q(display_name__icontains=query),
			is_active=True
		)[:10]  # Limit to 10 results
		
		serializer = UserPublicSerializer(users, many=True, context={'request': request})
		return Response({"results": serializer.data})
	
	@action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny])
	def profile(self, request, pk=None):
		"""Get user profile with products and reviews"""
		user = self.get_object()
		
		# Serialize user data
		user_serializer = UserPublicSerializer(user, context={'request': request})
		
		# Get user's products
		products = Product.objects.filter(seller=user, is_active=True)
		if not (request.user.is_authenticated and request.user.id == user.id):
			products = products.filter(moderation_status=Product.ModerationStatus.APPROVED)
		products = products.select_related('category')[:12]  # Limit to 12
		
		if request.user.is_authenticated:
			favorite_exists = Favorite.objects.filter(user=request.user, product=OuterRef("pk"))
			products = products.annotate(is_favorite=Exists(favorite_exists))
		else:
			products = products.annotate(is_favorite=models.Value(False, output_field=models.BooleanField()))
		
		product_serializer = ProductSerializer(products, many=True, context={'request': request})
		
		# Get reviews about this user
		reviews = Review.objects.filter(
			target_user=user
		).select_related('reviewer')[:10]  # Limit to 10
		
		review_serializer = ReviewSerializer(reviews, many=True, context={'request': request})
		
		# Calculate rating distribution
		rating_distribution = Review.objects.filter(target_user=user).values('rating').annotate(
			count=Count('rating')
		).order_by('-rating')
		
		return Response({
			"user": user_serializer.data,
			"products": product_serializer.data,
			"reviews": review_serializer.data,
			"rating_distribution": list(rating_distribution),
		})

	def update(self, request, *args, **kwargs):
		"""Allow users to update their own profile"""
		user = self.get_object()
		if request.user.id != user.id and not request.user.is_staff:
			return Response({"detail": "You can only edit your own profile"}, status=403)
		return super().update(request, *args, **kwargs)

	def partial_update(self, request, *args, **kwargs):
		"""Allow users to update their own profile"""
		user = self.get_object()
		if request.user.id != user.id and not request.user.is_staff:
			return Response({"detail": "You can only edit your own profile"}, status=403)
		return super().partial_update(request, *args, **kwargs)


class PublicUserDetailView(APIView):
	permission_classes = [permissions.AllowAny]

	def get(self, request, user_id):
		user = get_object_or_404(User, pk=user_id)
		serializer = UserPublicSerializer(user)
		return Response(serializer.data)


class UserReviewListCreateView(APIView):
	permission_classes = [permissions.IsAuthenticatedOrReadOnly]

	def get(self, request, user_id):
		reviews = Review.objects.filter(target_user_id=user_id).select_related("reviewer")
		serializer = ReviewSerializer(reviews, many=True)
		return Response(serializer.data)

	def post(self, request, user_id):
		target_user = get_object_or_404(User, pk=user_id)
		if request.user == target_user:
			raise ValidationError("Cannot review yourself")
		if Review.objects.filter(reviewer=request.user, target_user=target_user).exists():
			raise ValidationError("You have already reviewed this seller")
		accepted_purchase = Offer.objects.filter(
			buyer=request.user,
			product__seller=target_user,
			status=Offer.Status.ACCEPTED,
		).exists()
		if not accepted_purchase:
			raise ValidationError(
				"You can only review a seller after completing a purchase."
			)
		serializer = ReviewSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		serializer.save(reviewer=request.user, target_user=target_user)
		return Response(serializer.data, status=201)

	def _log_user_action(self, user, action, reason=""):
		AdminLog.objects.create(
			admin=self.request.user,
			action=action,
			target_user=user,
			reason=reason,
		)

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
	def suspend(self, request, pk=None):
		user = self.get_object()
		reason = request.data.get("reason", "")
		until_raw = request.data.get("suspended_until")
		suspended_until = None
		if until_raw:
			parsed = parse_datetime(until_raw)
			suspended_until = parsed
		user.is_suspended = True
		user.suspended_until = suspended_until
		user.save(update_fields=["is_suspended", "suspended_until"])
		self._log_user_action(user, AdminLog.Action.SUSPEND_USER, reason)
		return Response({"status": "suspended", "suspended_until": suspended_until})

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
	def unsuspend(self, request, pk=None):
		user = self.get_object()
		user.is_suspended = False
		user.suspended_until = None
		user.save(update_fields=["is_suspended", "suspended_until"])
		return Response({"status": "active"})

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
	def verify_seller(self, request, pk=None):
		user = self.get_object()
		user.is_verified_seller = True
		user.is_seller = True
		user.save(update_fields=["is_verified_seller", "is_seller"])
		self._log_user_action(user, AdminLog.Action.VERIFY_SELLER)
		return Response({"status": "verified"})

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
	def ban(self, request, pk=None):
		user = self.get_object()
		reason = request.data.get("reason", "")
		user.is_active = False
		user.save(update_fields=["is_active"])
		self._log_user_action(user, AdminLog.Action.BAN_USER, reason)
		return Response({"status": "banned"})



class NotificationViewSet(viewsets.ModelViewSet):
	serializer_class = NotificationSerializer
	permission_classes = [permissions.IsAuthenticated]
	ordering = ['-created_at']
	
	def get_queryset(self):
		return Notification.objects.filter(user=self.request.user)
	
	@action(detail=False, methods=['post'])
	def mark_all_read(self, request):
		"""Mark all notifications as read"""
		count = Notification.objects.filter(
			user=request.user,
			is_read=False
		).update(is_read=True)
		return Response({"status": "success", "updated": count})
	
	@action(detail=True, methods=['post'])
	def mark_read(self, request, pk=None):
		"""Mark single notification as read"""
		notification = self.get_object()
		notification.is_read = True
		notification.save()
		return Response(NotificationSerializer(notification).data)
	
	@action(detail=False, methods=['get'])
	def unread_count(self, request):
		"""Get count of unread notifications"""
		count = Notification.objects.filter(
			user=request.user,
			is_read=False
		).count()
		return Response({"count": count})



class FriendshipViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing friendships/friend requests.
    
    Actions:
    - list: Get all friendships (accepted + pending)
    - create: Send friend request
    - accept: Accept friend request
    - reject: Reject friend request
    - destroy: Remove friend/cancel request
    """
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get friendships where user is either requester or receiver
        return Friendship.objects.filter(
            models.Q(requester=user) | models.Q(receiver=user)
        ).select_related('requester', 'receiver')
    
    def perform_create(self, serializer):
        # Set requester to current user
        friendship = serializer.save(requester=self.request.user)
        
        # Create notification for friend request
        Notification.objects.create(
            user=friendship.receiver,
            notification_type=Notification.Type.MESSAGE,  # We'll use MESSAGE type for now
            title="New Friend Request",
            message=f"{friendship.requester.display_name or friendship.requester.username} sent you a friend request",
            link=f"/shop/{friendship.requester.id}",
        )
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a friend request"""
        friendship = self.get_object()
        
        # Only receiver can accept
        if friendship.receiver != request.user:
            return Response(
                {"detail": "Only the receiver can accept this request"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if friendship.status != Friendship.Status.PENDING:
            return Response(
                {"detail": "This request is no longer pending"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        friendship.status = Friendship.Status.ACCEPTED
        friendship.save()
        
        # Create notification for requester
        Notification.objects.create(
            user=friendship.requester,
            notification_type=Notification.Type.MESSAGE,
            title="Friend Request Accepted",
            message=f"{friendship.receiver.display_name or friendship.receiver.username} accepted your friend request",
            link=f"/shop/{friendship.receiver.id}",
        )
        
        serializer = self.get_serializer(friendship)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a friend request"""
        friendship = self.get_object()
        
        # Only receiver can reject
        if friendship.receiver != request.user:
            return Response(
                {"detail": "Only the receiver can reject this request"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if friendship.status != Friendship.Status.PENDING:
            return Response(
                {"detail": "This request is no longer pending"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        friendship.status = Friendship.Status.REJECTED
        friendship.save()
        
        serializer = self.get_serializer(friendship)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def friends(self, request):
        """Get list of accepted friends only"""
        user = request.user
        friendships = Friendship.objects.filter(
            models.Q(requester=user, status=Friendship.Status.ACCEPTED) |
            models.Q(receiver=user, status=Friendship.Status.ACCEPTED)
        ).select_related('requester', 'receiver')
        
        # Extract the friend (not the current user)
        friends = []
        for friendship in friendships:
            friend = friendship.receiver if friendship.requester == user else friendship.requester
            friends.append({
                'id': friend.id,
                'username': friend.username,
                'display_name': friend.display_name,
                'avatar_url': friend.get_avatar_url(),
                'is_verified_seller': friend.is_verified_seller,
            })
        
        return Response(friends)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending friend requests (received)"""
        user = request.user
        pending_requests = Friendship.objects.filter(
            receiver=user,
            status=Friendship.Status.PENDING
        ).select_related('requester')
        
        serializer = self.get_serializer(pending_requests, many=True)
        return Response(serializer.data)



class CommentViewSet(viewsets.ModelViewSet):
	"""
	ViewSet for managing comments on products.
	"""
	serializer_class = CommentSerializer
	permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsSellerOrReadOnly]
	throttle_classes = [CommentRateThrottle]  # Rate limit comments
	filterset_fields = ["product", "parent"]
	ordering = ["-created_at"]
	
	def get_queryset(self):
		"""Get comments, optionally filtered by product"""
		queryset = Comment.objects.select_related("user", "product", "parent").prefetch_related("replies__user", "reactions__user")
		user = self.request.user

		if user.is_authenticated and not user.is_staff:
			visible = models.Q(is_private=False, user__is_private=False)
			visible |= models.Q(user=user)
			visible |= models.Q(product__seller=user)
			queryset = queryset.filter(visible)
		elif not user.is_authenticated:
			queryset = queryset.filter(is_private=False, user__is_private=False)

		if user.is_authenticated and (user.is_staff or self.request.query_params.get("include_deleted") == "1"):
			pass
		elif user.is_authenticated:
			queryset = queryset.filter(models.Q(is_deleted=False) | models.Q(user=user) | models.Q(product__seller=user))
		else:
			queryset = queryset.filter(is_deleted=False)
		
		# Filter to only top-level comments by default
		if self.action == "list" and not self.request.query_params.get("parent"):
			queryset = queryset.filter(parent=None)
		
		return queryset
	
	def perform_create(self, serializer):
		"""Create comment and notify product owner"""
		comment = serializer.save(
			user=self.request.user,
			is_private=bool(serializer.validated_data.get("is_private")) or self.request.user.is_private,
		)
		
		# Create notification for product owner (if not commenting on own product)
		if comment.product.seller != self.request.user:
			# Check if it's a reply
			if comment.parent:
				# Notify the parent comment author
				notification_user = comment.parent.user
				notification_title = "New Reply to Your Comment"
				notification_message = f"{self.request.user.display_name or self.request.user.username} replied to your comment"
			else:
				# Notify product owner
				notification_user = comment.product.seller
				notification_title = "New Comment on Your Product"
				notification_message = f"{self.request.user.display_name or self.request.user.username} commented on {comment.product.title}"
			
			Notification.objects.create(
				user=notification_user,
				notification_type=Notification.Type.COMMENT,
				title=notification_title,
				message=notification_message,
				link=f"/products/{comment.product.id}",
				related_product=comment.product,
				related_user=self.request.user,
			)

	def perform_update(self, serializer):
		instance = self.get_object()
		if instance.user != self.request.user and not self.request.user.is_staff:
			raise ValidationError("You can only edit your own comments")
		serializer.save()
	
	def perform_destroy(self, instance):
		"""Soft-delete own comments so replies remain visible"""
		if instance.user != self.request.user and not self.request.user.is_staff:
			raise ValidationError("You can only delete your own comments")
		instance.is_deleted = True
		instance.body = "[deleted]"
		instance.save(update_fields=["is_deleted", "body", "updated_at"])

	@action(detail=True, methods=["post"])
	def reply(self, request, pk=None):
		comment = self.get_object()
		payload = dict(request.data)
		payload["product"] = comment.product_id
		payload["parent"] = comment.id
		serializer = self.get_serializer(data=payload)
		serializer.is_valid(raise_exception=True)
		reply_is_private = bool(serializer.validated_data.get("is_private")) or request.user.is_private
		reply = serializer.save(user=request.user, product=comment.product, parent=comment, is_private=reply_is_private)

		if comment.user != request.user:
			Notification.objects.create(
				user=comment.user,
				notification_type=Notification.Type.COMMENT,
				title="New Reply to Your Comment",
				message=f"{request.user.display_name or request.user.username} replied to your comment",
				link=f"/products/{comment.product.id}",
				related_product=comment.product,
				related_user=request.user,
			)

		return Response(self.get_serializer(reply).data, status=status.HTTP_201_CREATED)

	@action(detail=True, methods=["post"])
	def react(self, request, pk=None):
		comment = self.get_object()
		if comment.is_deleted:
			raise ValidationError({"detail": "Cannot react to a deleted comment"})
		reaction_type = request.data.get("reaction_type", "like")
		if reaction_type not in dict(CommentReaction.ReactionType.choices):
			raise ValidationError({"reaction_type": "Invalid reaction type"})

		reaction, created = CommentReaction.objects.get_or_create(
			comment=comment,
			user=request.user,
			defaults={"reaction_type": reaction_type},
		)

		if not created and reaction.reaction_type == reaction_type:
			reaction.delete()
		else:
			reaction.reaction_type = reaction_type
			reaction.save(update_fields=["reaction_type", "updated_at"])
			if comment.user != request.user:
				Notification.objects.create(
					user=comment.user,
					notification_type=Notification.Type.COMMENT,
					title="New Reaction to Your Comment",
					message=f"{request.user.display_name or request.user.username} reacted to your comment",
					link=f"/products/{comment.product.id}",
					related_product=comment.product,
					related_user=request.user,
				)

		comment.refresh_from_db()
		return Response(self.get_serializer(comment).data)

	@action(detail=True, methods=["post", "patch"])
	def toggle_privacy(self, request, pk=None):
		comment = self.get_object()
		if comment.user != request.user and not request.user.is_staff:
			raise ValidationError("You can only change privacy on your own comments")
		comment.is_private = not comment.is_private if request.data.get("is_private") is None else bool(request.data.get("is_private"))
		comment.save(update_fields=["is_private"])
		return Response(self.get_serializer(comment).data)
