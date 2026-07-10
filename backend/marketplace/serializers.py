from django.db import models as django_models
from django.db.models import Avg, Q
from rest_framework import serializers

from .models import AdminLog, Category, Comment, CommentReaction, Dispute, Favorite, Friendship, Message, Notification, Offer, Product, ProductImage, Review, User
from .utils.sanitization import sanitize_text


class UserPublicSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "display_name",
            "avatar_url",
            "is_verified_seller",
            "average_rating",
            "review_count",
            "date_joined",
            "is_private",
            "total_sales",
            "bio",
            "location",
        )

    def get_avatar_url(self, obj: User) -> str:
        avatar_path = obj.get_avatar_url()
        if avatar_path and not avatar_path.startswith('http'):
            # Build full URL for relative paths
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(avatar_path)
            # Fallback for when no request in context
            return f"http://127.0.0.1:8000{avatar_path}"
        return avatar_path

    def get_average_rating(self, obj: User) -> float:
        return obj.reviews_received.aggregate(avg=Avg("rating"))["avg"] or 0.0

    def get_review_count(self, obj: User) -> int:
        return obj.reviews_received.count()


class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserPublicSerializer(read_only=True)
    target_user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "reviewer",
            "target_user",
            "rating",
            "comment",
            "created_at",
        )
        read_only_fields = ("reviewer", "target_user", "created_at")


class UserAdminSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "display_name",
            "avatar_url",
            "avatar",
            "is_seller",
            "is_verified_seller",
            "is_suspended",
            "suspended_until",
            "is_active",
            "date_joined",
        )
        extra_kwargs = {
            "avatar": {"write_only": True, "required": False}
        }
    
    def get_avatar_url(self, obj: User) -> str:
        avatar_path = obj.get_avatar_url()
        if avatar_path and not avatar_path.startswith('http'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(avatar_path)
            return f"http://127.0.0.1:8000{avatar_path}"
        return avatar_path


class UserMeSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "display_name",
            "avatar_url",
            "is_verified_seller",
            "is_staff",
            "is_private",
            "total_sales",
            "bio",
            "location",
        )
    
    def get_avatar_url(self, obj: User) -> str:
        avatar_path = obj.get_avatar_url()
        if avatar_path and not avatar_path.startswith('http'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(avatar_path)
            return f"http://127.0.0.1:8000{avatar_path}"
        return avatar_path


class UserMeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("display_name", "avatar", "location", "bio", "is_private")
        extra_kwargs = {"avatar": {"required": False}}
    
    def validate_avatar(self, value):
        """Validate avatar file"""
        if value:
            # Check file size (max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Image file too large ( > 5MB )")
            
            # Check file type
            if not value.content_type.startswith('image/'):
                raise serializers.ValidationError("File is not an image")
        
        return value


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "parent", "is_active", "created_at", "updated_at")


class ProductSerializer(serializers.ModelSerializer):
    seller = UserPublicSerializer(read_only=True)
    is_favorite = serializers.BooleanField(read_only=True)
    image_urls = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    favorites_count = serializers.SerializerMethodField()
    images = serializers.ListField(
        child=serializers.ImageField(max_length=None, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Product
        fields = (
            "id",
            "seller",
            "category",
            "title",
            "description",
            "price",
            "currency",
            "condition",
            "moderation_status",
            "moderation_reason",
            "is_active",
            "is_featured",
            "brand",
            "location",
            "geo_lat",
            "geo_lng",
            "image_urls",
            "images",
            "tags",
            "view_count",
            "is_favorite",
            "comments_count",
            "favorites_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("moderation_status", "moderation_reason", "view_count")

    def get_comments_count(self, obj: Product) -> int:
        return obj.comments.count()

    def get_favorites_count(self, obj: Product) -> int:
        return obj.favorited_by.count()

    def get_image_urls(self, obj: Product) -> list[str]:
        if obj.images.exists():
            image_urls = []
            for image in obj.images.all():
                url = image.image.url
                if url and not url.startswith('http'):
                    request = self.context.get('request')
                    if request is not None:
                        url = request.build_absolute_uri(url)
                    else:
                        url = f"http://127.0.0.1:8000{url}"
                image_urls.append(url)
            return image_urls
        return obj.image_urls or []

    def create(self, validated_data):
        images = validated_data.pop("images", [])
        product = super().create(validated_data)
        if images:
            created_urls = []
            for image in images:
                created = ProductImage.objects.create(product=product, image=image)
                created_urls.append(created.image.url)
            product.image_urls = created_urls
            product.save(update_fields=["image_urls"])
        return product

    def update(self, instance, validated_data):
        images = validated_data.pop("images", [])
        product = super().update(instance, validated_data)
        if images:
            created_urls = []
            for image in images:
                created = ProductImage.objects.create(product=product, image=image)
                created_urls.append(created.image.url)
            product.image_urls = [*product.image_urls, *created_urls]
            product.save(update_fields=["image_urls"])
        return product

    def validate_description(self, value: str) -> str:
        return sanitize_text(value)

    def validate_title(self, value: str) -> str:
        return sanitize_text(value)


class MessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    recipient = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        error_messages={
            'required': 'Recipient is required',
            'does_not_exist': 'Invalid recipient ID',
            'incorrect_type': 'Recipient must be a valid user ID',
        }
    )
    recipient_detail = UserPublicSerializer(source="recipient", read_only=True)
    product_detail = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = Message
        fields = (
            "id",
            "thread_id",
            "sender",
            "recipient",
            "recipient_detail",
            "product",
            "product_detail",
            "message_type",
            "body",
            "is_read",
            "delivered_at",
            "read_at",
            "created_at",
        )
        read_only_fields = ("thread_id", "message_type", "delivered_at", "read_at")

    def validate_body(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("Message body cannot be empty")
        return sanitize_text(value)
    
    def validate_recipient(self, value):
        """Ensure recipient is not the same as sender"""
        if hasattr(self, 'context') and 'request' in self.context:
            if value == self.context['request'].user:
                raise serializers.ValidationError("Cannot send message to yourself")
        return value


class AdminLogSerializer(serializers.ModelSerializer):
    admin = UserPublicSerializer(read_only=True)

    class Meta:
        model = AdminLog
        fields = (
            "id",
            "admin",
            "action",
            "target_user",
            "target_product",
            "reason",
            "metadata",
            "ip_address",
            "created_at",
        )
        read_only_fields = fields


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ("id", "product", "created_at")


class OfferSerializer(serializers.ModelSerializer):
    buyer = UserPublicSerializer(read_only=True)
    product_detail = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = Offer
        fields = (
            "id",
            "buyer",
            "product",
            "product_detail",
            "proposed_price",
            "counter_price",
            "status",
            "expires_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("status", "counter_price")

    def validate_proposed_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Proposed price must be positive")
        return value


class DisputeSerializer(serializers.ModelSerializer):
    reporter = UserPublicSerializer(read_only=True)

    class Meta:
        model = Dispute
        fields = (
            "id",
            "reporter",
            "target_user",
            "target_product",
            "reason",
            "status",
            "resolution_notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("status", "resolution_notes")

    def validate_reason(self, value: str) -> str:
        return sanitize_text(value)


class AdminDisputeSerializer(serializers.ModelSerializer):
    reporter = UserPublicSerializer(read_only=True)

    class Meta:
        model = Dispute
        fields = (
            "id",
            "reporter",
            "target_user",
            "target_product",
            "reason",
            "status",
            "resolution_notes",
            "created_at",
            "updated_at",
        )

    def validate_resolution_notes(self, value: str) -> str:
        return sanitize_text(value)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id",
            "notification_type",
            "title",
            "message",
            "link",
            "is_read",
            "created_at",
        )
        read_only_fields = fields



class FriendshipSerializer(serializers.ModelSerializer):
    requester = UserPublicSerializer(read_only=True)
    receiver = UserPublicSerializer(read_only=True)
    receiver_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='receiver',
        write_only=True,
        error_messages={
            'required': 'Receiver is required',
            'does_not_exist': 'Invalid user ID',
        }
    )

    class Meta:
        model = Friendship
        fields = (
            "id",
            "requester",
            "receiver",
            "receiver_id",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("requester", "status")

    def validate_receiver_id(self, value):
        """Ensure user can't friend themselves and no duplicate requests"""
        if hasattr(self, 'context') and 'request' in self.context:
            requester = self.context['request'].user
            
            # Can't friend yourself
            if value == requester:
                raise serializers.ValidationError("Cannot send friend request to yourself")
            
            # Check for existing friendship
            existing = Friendship.objects.filter(
                Q(requester=requester, receiver=value) |
                Q(requester=value, receiver=requester)
            ).first()
            
            if existing:
                if existing.status == Friendship.Status.PENDING:
                    if existing.requester == requester:
                        raise serializers.ValidationError("You already sent a friend request to this user")
                    else:
                        raise serializers.ValidationError("This user already sent you a friend request. Check your pending requests.")
                elif existing.status == Friendship.Status.ACCEPTED:
                    raise serializers.ValidationError("You are already friends with this user")
                elif existing.status == Friendship.Status.REJECTED:
                    raise serializers.ValidationError("Friend request was rejected")
                elif existing.status == Friendship.Status.BLOCKED:
                    raise serializers.ValidationError("Unable to send friend request")
        
        return value



class CommentSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()
    reaction_count = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            "id",
            "product",
            "user",
            "body",
            "is_deleted",
            "is_private",
            "parent",
            "replies",
            "reply_count",
            "reaction_count",
            "user_reaction",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("user", "reaction_count", "user_reaction")

    def get_replies(self, obj):
        """Get replies for this comment (only first level)"""
        if obj.parent is None:  # Only get replies for top-level comments
            replies = obj.replies.all()[:5]  # Limit to 5 replies initially
            return CommentSerializer(replies, many=True, context=self.context).data
        return []

    def get_reply_count(self, obj):
        """Get total reply count"""
        if obj.parent is None:
            return obj.replies.count()
        return 0

    def get_reaction_count(self, obj):
        return obj.reactions.count()

    def get_user_reaction(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        reaction = obj.reactions.filter(user=request.user).first()
        return reaction.reaction_type if reaction else None

    def validate_body(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("Comment cannot be empty")
        return sanitize_text(value)

    def validate_parent(self, value):
        if value and value.product_id != self.initial_data.get("product"):
            raise serializers.ValidationError("Reply must belong to the same product")
        return value

    def validate_is_private(self, value):
        return bool(value)
