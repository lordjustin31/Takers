import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		abstract = True


class User(AbstractUser):
	display_name = models.CharField(max_length=120, blank=True)
	email = models.EmailField(unique=True)
	avatar_url = models.URLField(blank=True)
	avatar = models.ImageField(upload_to="avatars/%Y/%m/%d", blank=True, null=True)
	bio = models.TextField(blank=True)
	location = models.CharField(max_length=160, blank=True)
	is_seller = models.BooleanField(default=False)
	is_verified_seller = models.BooleanField(default=False)
	is_suspended = models.BooleanField(default=False)
	suspended_until = models.DateTimeField(null=True, blank=True)
	rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
	is_private = models.BooleanField(default=False)  # New privacy field
	total_sales = models.PositiveIntegerField(default=0)  # Track sold items

	def __str__(self) -> str:
		return self.username
	
	def get_avatar_url(self):
		"""Return avatar URL, prioritizing uploaded avatar over URL"""
		if self.avatar:
			return self.avatar.url
		return self.avatar_url


class Shop(TimeStampedModel):
	owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name="shop")
	name = models.CharField(max_length=140)
	slug = models.SlugField(max_length=160, unique=True)
	description = models.TextField(blank=True)
	is_active = models.BooleanField(default=True)

	def __str__(self) -> str:
		return self.name


class Category(TimeStampedModel):
	name = models.CharField(max_length=120)
	slug = models.SlugField(max_length=160, unique=True)
	parent = models.ForeignKey(
		"self",
		null=True,
		blank=True,
		related_name="children",
		on_delete=models.SET_NULL,
	)
	is_active = models.BooleanField(default=True)

	def __str__(self) -> str:
		return self.name


class Product(TimeStampedModel):
	class Condition(models.TextChoices):
		NEW = "new", "New"
		LIKE_NEW = "like_new", "Like new"
		GOOD = "good", "Good"
		FAIR = "fair", "Fair"

	class ModerationStatus(models.TextChoices):
		PENDING = "pending", "Pending"
		APPROVED = "approved", "Approved"
		REJECTED = "rejected", "Rejected"
		FLAGGED = "flagged", "Flagged"

	seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="products")
	category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
	title = models.CharField(max_length=180)
	description = models.TextField()
	price = models.DecimalField(max_digits=12, decimal_places=2)
	currency = models.CharField(max_length=3, default="PHP")
	condition = models.CharField(
		max_length=20, choices=Condition.choices, default=Condition.GOOD
	)
	moderation_status = models.CharField(
		max_length=20, choices=ModerationStatus.choices, default=ModerationStatus.PENDING
	)
	moderation_reason = models.TextField(blank=True)
	is_active = models.BooleanField(default=True)
	is_featured = models.BooleanField(default=False)
	brand = models.CharField(max_length=120, blank=True)
	location = models.CharField(max_length=160, blank=True)
	geo_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
	geo_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
	image_urls = models.JSONField(default=list, blank=True)
	tags = models.JSONField(default=list, blank=True)
	view_count = models.PositiveIntegerField(default=0)

	def __str__(self) -> str:
		return self.title


class ProductImage(TimeStampedModel):
	product = models.ForeignKey(
		Product, on_delete=models.CASCADE, related_name="images"
	)
	image = models.ImageField(upload_to="products/%Y/%m/%d")

	def __str__(self) -> str:
		return self.image.name


class Review(TimeStampedModel):
	reviewer = models.ForeignKey(
		User,
		on_delete=models.CASCADE,
		related_name="reviews_given",
	)
	target_user = models.ForeignKey(
		User,
		on_delete=models.CASCADE,
		related_name="reviews_received",
	)
	transaction = models.ForeignKey(
		"Transaction",
		on_delete=models.CASCADE,
		related_name="reviews",
		null=True,  # Temporary for existing data
		blank=True,
	)
	rating = models.PositiveSmallIntegerField(
		validators=[MinValueValidator(1), MaxValueValidator(5)]
	)
	comment = models.TextField(blank=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=["reviewer", "target_user", "transaction"],
				name="unique_review_per_transaction",
			)
		]

	def __str__(self) -> str:
		return f"Review {self.reviewer} -> {self.target_user}"


class Message(TimeStampedModel):
	class MessageType(models.TextChoices):
		GENERAL = "general", "General"
		MARKETPLACE = "marketplace", "Marketplace"
	
	thread_id = models.UUIDField(default=uuid.uuid4, editable=False)
	sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
	recipient = models.ForeignKey(
		User, on_delete=models.CASCADE, related_name="received_messages"
	)
	product = models.ForeignKey(
		Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="messages"
	)
	message_type = models.CharField(
		max_length=20,
		choices=MessageType.choices,
		default=MessageType.GENERAL
	)
	body = models.TextField()
	is_read = models.BooleanField(default=False)
	delivered_at = models.DateTimeField(null=True, blank=True)
	read_at = models.DateTimeField(null=True, blank=True)

	def __str__(self) -> str:
		return f"{self.sender} -> {self.recipient}"
	
	def save(self, *args, **kwargs):
		"""Auto-set message_type based on product field and delivered_at on creation"""
		if self.product and not self.message_type:
			self.message_type = self.MessageType.MARKETPLACE
		elif not self.message_type:
			self.message_type = self.MessageType.GENERAL
		
		# Set delivered_at on creation (when message is sent)
		if not self.pk and not self.delivered_at:
			self.delivered_at = timezone.now()
		
		super().save(*args, **kwargs)


class AdminLog(TimeStampedModel):
	class Action(models.TextChoices):
		SUSPEND_USER = "suspend_user", "Suspend user"
		BAN_USER = "ban_user", "Ban user"
		VERIFY_SELLER = "verify_seller", "Verify seller"
		PRODUCT_APPROVED = "product_approved", "Product approved"
		PRODUCT_REJECTED = "product_rejected", "Product rejected"
		PRODUCT_FLAGGED = "product_flagged", "Product flagged"
		OFFER_ACCEPTED = "offer_accepted", "Offer accepted"
		OFFER_REJECTED = "offer_rejected", "Offer rejected"
		OFFER_COUNTERED = "offer_countered", "Offer countered"
		DISPUTE_ARBITRATED = "dispute_arbitrated", "Dispute arbitrated"

	admin = models.ForeignKey(
		User, on_delete=models.CASCADE, related_name="admin_actions"
	)
	action = models.CharField(max_length=40, choices=Action.choices)
	target_user = models.ForeignKey(
		User,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="targeted_admin_logs",
	)
	target_product = models.ForeignKey(
		Product,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="admin_logs",
	)
	reason = models.TextField(blank=True)
	metadata = models.JSONField(default=dict, blank=True)
	ip_address = models.GenericIPAddressField(null=True, blank=True)

	def __str__(self) -> str:
		return f"{self.action} by {self.admin}"


class Favorite(TimeStampedModel):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
	product = models.ForeignKey(
		Product, on_delete=models.CASCADE, related_name="favorited_by"
	)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=["user", "product"], name="unique_user_favorite"
			)
		]

	def __str__(self) -> str:
		return f"{self.user} -> {self.product}"


class Offer(TimeStampedModel):
	class Status(models.TextChoices):
		PENDING = "pending", "Pending"
		ACCEPTED = "accepted", "Accepted"
		COUNTER = "counter_offer", "Counter offer"
		REJECTED = "rejected", "Rejected"
		EXPIRED = "expired", "Expired"

	buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="offers")
	product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="offers")
	proposed_price = models.DecimalField(max_digits=12, decimal_places=2)
	counter_price = models.DecimalField(
		max_digits=12, decimal_places=2, null=True, blank=True
	)
	status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
	expires_at = models.DateTimeField(null=True, blank=True)

	def __str__(self) -> str:
		return f"{self.buyer} -> {self.product} ({self.status})"


class Transaction(TimeStampedModel):
	"""Track completed purchases for review eligibility"""
	class Status(models.TextChoices):
		PENDING = "pending", "Pending"
		COMPLETED = "completed", "Completed"
		CANCELLED = "cancelled", "Cancelled"
	
	buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="purchases")
	seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sales")
	product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name="transactions")
	final_price = models.DecimalField(max_digits=12, decimal_places=2)
	status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
	completed_at = models.DateTimeField(null=True, blank=True)
	
	# Review tracking
	buyer_reviewed = models.BooleanField(default=False)
	seller_reviewed = models.BooleanField(default=False)
	
	class Meta:
		ordering = ['-created_at']
	
	def __str__(self) -> str:
		return f"Transaction: {self.buyer} bought from {self.seller}"


class Dispute(TimeStampedModel):
	class Status(models.TextChoices):
		OPEN = "open", "Open"
		UNDER_REVIEW = "under_review", "Under review"
		RESOLVED = "resolved", "Resolved"

	reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="disputes")
	target_user = models.ForeignKey(
		User,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="reported_disputes",
	)
	target_product = models.ForeignKey(
		Product,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="disputes",
	)
	reason = models.TextField()
	status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
	resolution_notes = models.TextField(blank=True)

	def __str__(self) -> str:
		return f"Dispute {self.id} ({self.status})"


class Friendship(TimeStampedModel):
	class Status(models.TextChoices):
		PENDING = "pending", "Pending"
		ACCEPTED = "accepted", "Accepted"
		REJECTED = "rejected", "Rejected"
		BLOCKED = "blocked", "Blocked"
	
	requester = models.ForeignKey(
		User, on_delete=models.CASCADE, related_name="friend_requests_sent"
	)
	receiver = models.ForeignKey(
		User, on_delete=models.CASCADE, related_name="friend_requests_received"
	)
	status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
	
	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=["requester", "receiver"], name="unique_friendship"
			)
		]
		ordering = ['-created_at']
	
	def __str__(self) -> str:
		return f"{self.requester} -> {self.receiver} ({self.status})"


class Notification(TimeStampedModel):
	class Type(models.TextChoices):
		MESSAGE = "message", "New Message"
		LIKE = "like", "Item Liked"
		OFFER = "offer", "New Offer"
		PRICE_DROP = "price_drop", "Price Drop"
		PAYMENT = "payment", "Payment Received"
		REVIEW = "review", "New Review"
		COMMENT = "comment", "New Comment"
	
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
	notification_type = models.CharField(max_length=20, choices=Type.choices)
	title = models.CharField(max_length=200)
	message = models.TextField()
	link = models.CharField(max_length=500, blank=True)
	is_read = models.BooleanField(default=False)
	related_product = models.ForeignKey(
		Product, 
		on_delete=models.SET_NULL, 
		null=True, 
		blank=True
	)
	related_user = models.ForeignKey(
		User,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="related_notifications"
	)
	
	class Meta:
		ordering = ['-created_at']
	
	def __str__(self):
		return f"{self.notification_type} for {self.user.username}"


class Comment(TimeStampedModel):
	"""Comments on products/posts"""
	product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="comments")
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
	body = models.TextField()
	is_private = models.BooleanField(default=False)
	is_deleted = models.BooleanField(default=False)
	parent = models.ForeignKey(
		'self',
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='replies'
	)
	
	class Meta:
		ordering = ['-created_at']
	
	def __str__(self):
		return f"Comment by {self.user.username} on {self.product.title}"


class CommentReaction(TimeStampedModel):
	"""Reactions on comments"""
	class ReactionType(models.TextChoices):
		LIKE = "like", "Like"
		LOVE = "love", "Love"
		HAHA = "haha", "Haha"
		SUPPORT = "support", "Support"

	comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="reactions")
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comment_reactions")
	reaction_type = models.CharField(max_length=20, choices=ReactionType.choices, default=ReactionType.LIKE)

	class Meta:
		unique_together = ("comment", "user")
		ordering = ["-created_at"]

	def __str__(self):
		return f"{self.user.username} reacted to comment {self.comment_id}"
