from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUserOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class IsSellerOrReadOnly(BasePermission):
    """
    Object-level permission to only allow sellers/owners of a product/comment to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        # Check either 'seller' (for Products) or 'user' (for Comments)
        owner = getattr(obj, "seller", None) or getattr(obj, "user", None)
        return bool(request.user and (owner == request.user or request.user.is_staff))


class MessageOwnerPermission(BasePermission):
    """Allow only participants (sender or recipient) to access a message."""
    def has_object_permission(self, request, view, obj):
        user = request.user
        return bool(user and (obj.sender == user or obj.recipient == user))
