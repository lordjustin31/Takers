from django.contrib import admin

from .models import (
	AdminLog,
	Category,
	Comment,
	Dispute,
	Favorite,
	Message,
	Offer,
	Product,
	ProductImage,
	Review,
	Shop,
	User,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
	list_display = ("username", "email", "is_seller", "is_verified_seller", "is_suspended")
	list_filter = ("is_seller", "is_verified_seller", "is_suspended")
	search_fields = ("username", "email", "display_name")


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
	list_display = ("name", "owner", "is_active", "created_at")
	list_filter = ("is_active",)
	search_fields = ("name", "owner__username")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ("name", "slug", "parent", "is_active")
	list_filter = ("is_active",)
	search_fields = ("name", "slug")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
	list_display = ("title", "seller", "moderation_status", "price", "currency", "created_at")
	list_filter = ("moderation_status", "is_active", "is_featured")
	search_fields = ("title", "seller__username", "brand")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
	list_display = ("sender", "recipient", "product", "is_read", "created_at")
	list_filter = ("is_read",)
	search_fields = ("sender__username", "recipient__username")


@admin.register(AdminLog)
class AdminLogAdmin(admin.ModelAdmin):
	list_display = ("action", "admin", "target_user", "target_product", "created_at")
	list_filter = ("action",)
	search_fields = ("admin__username", "target_user__username")


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
	list_display = ("user", "product", "created_at")
	search_fields = ("user__username", "product__title")


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
	list_display = ("buyer", "product", "proposed_price", "status", "created_at")
	list_filter = ("status",)
	search_fields = ("buyer__username", "product__title")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
	list_display = ("reviewer", "target_user", "rating", "created_at")
	list_filter = ("rating",)
	search_fields = ("reviewer__username", "target_user__username")


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
	list_display = ("product", "image", "created_at")
	search_fields = ("product__title",)


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
	list_display = ("reporter", "target_user", "target_product", "status", "created_at")
	list_filter = ("status",)
	search_fields = ("reporter__username", "target_user__username")



@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
	list_display = ("user", "product", "body_preview", "parent", "created_at")
	list_filter = ("created_at",)
	search_fields = ("user__username", "product__title", "body")
	
	def body_preview(self, obj):
		return obj.body[:50] + "..." if len(obj.body) > 50 else obj.body
	body_preview.short_description = "Comment"
