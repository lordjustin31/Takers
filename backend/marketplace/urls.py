from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminDashboardStatsView,
    AdminDisputeViewSet,
    AdminLogViewSet,
    AdminTrendingView,
    CategoryViewSet,
    CommentViewSet,
    DisputeViewSet,
    FavoriteViewSet,
    FriendshipViewSet,
    HealthCheckView,
    MessageViewSet,
    NotificationViewSet,
    OfferViewSet,
    ProductViewSet,
    PublicUserDetailView,
    UserReviewListCreateView,
    UserViewSet,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")
router.register("comments", CommentViewSet, basename="comment")
router.register("favorites", FavoriteViewSet, basename="favorite")
router.register("offers", OfferViewSet, basename="offer")
router.register("disputes", DisputeViewSet, basename="dispute")
router.register("messages", MessageViewSet, basename="message")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("friendships", FriendshipViewSet, basename="friendship")
router.register("users", UserViewSet, basename="user")  # Public user endpoints
router.register("admin/logs", AdminLogViewSet, basename="admin-log")
router.register("admin/users", UserViewSet, basename="admin-user")
router.register("admin/disputes", AdminDisputeViewSet, basename="admin-dispute")

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health_check"),
    path(
        "admin/dashboard-stats/",
        AdminDashboardStatsView.as_view(),
        name="admin-dashboard-stats",
    ),
    path("admin/trending/", AdminTrendingView.as_view(), name="admin-trending"),
    path("users/<int:user_id>/", PublicUserDetailView.as_view(), name="user-detail"),
    path("users/<int:user_id>/reviews/", UserReviewListCreateView.as_view(), name="user-reviews"),
    path("", include(router.urls)),
]
