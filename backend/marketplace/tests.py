from unittest.mock import patch

from django.test import RequestFactory, TestCase

from .auth_views import GoogleAuthView, RegisterView, ThrottledTokenObtainPairView
from .models import User


class GoogleAuthViewTests(TestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()
        self.view = GoogleAuthView.as_view()

    @patch("marketplace.auth_views.verify_access_token")
    @patch("marketplace.auth_views.fetch_userinfo")
    @patch("marketplace.auth_views.verify_id_token")
    @patch("marketplace.auth_views.exchange_code_for_tokens")
    def test_google_auth_uses_redirect_uri_from_request(
        self,
        exchange_code_for_tokens,
        verify_id_token,
        fetch_userinfo,
        verify_access_token,
    ):
        exchange_code_for_tokens.return_value = {
            "access_token": "google-access",
            "id_token": "google-id",
        }
        verify_id_token.return_value = {
            "email": "demo@example.com",
            "name": "Demo User",
            "picture": "https://example.com/avatar.png",
        }
        fetch_userinfo.return_value = {
            "email": "demo@example.com",
            "name": "Demo User",
            "picture": "https://example.com/avatar.png",
        }
        verify_access_token.return_value = None

        request = self.factory.post(
            "/api/auth/google/",
            {"code": "abc123", "redirect_uri": "http://localhost:5173"},
        )

        response = self.view(request)

        self.assertEqual(response.status_code, 200)
        exchange_code_for_tokens.assert_called_once_with("abc123", "http://localhost:5173")


class RegisterViewTests(TestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()
        self.view = RegisterView.as_view()

    def test_register_creates_user_and_returns_tokens(self) -> None:
        request = self.factory.post(
            "/api/auth/register/",
            {
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "StrongPass123",
            },
        )

        response = self.view(request)

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "newuser@example.com")


class TokenObtainPairViewTests(TestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()
        self.view = ThrottledTokenObtainPairView.as_view()

    def test_login_accepts_email_instead_of_username(self) -> None:
        User.objects.create_user(
            username="demo",
            email="demo@example.com",
            password="StrongPass123",
        )

        request = self.factory.post(
            "/api/auth/token/",
            {"username": "demo@example.com", "password": "StrongPass123"},
        )

        response = self.view(request)

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)


from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Product, Category, Message, Comment, Transaction
from django.contrib.auth.hashers import identify_hasher

User = get_user_model()

class SecurityHardeningTests(APITestCase):
    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(username="user1", email="user1@example.com", password="Password123!")
        self.user2 = User.objects.create_user(username="user2", email="user2@example.com", password="Password123!")
        
        # Create a category
        self.category = Category.objects.create(name="Electronics", slug="electronics")
        
        # Create a product owned by user1
        self.product = Product.objects.create(
            seller=self.user1,
            category=self.category,
            title="Old Phone",
            description="Good condition",
            price=150.00,
            moderation_status=Product.ModerationStatus.APPROVED,
            is_active=True
        )

    def test_password_hashing_uses_argon2(self):
        """Verify that newly created passwords use Argon2 hashing."""
        hasher = identify_hasher(self.user1.password)
        self.assertEqual(hasher.algorithm, "argon2")

    def test_generic_exception_handler_sanitizes_500(self):
        """Test that unhandled server exceptions return generic error and hide tracebacks."""
        from config.exceptions import custom_exception_handler

        class FakeException(Exception):
            pass

        class DummyContext:
            class FakeRequest:
                path = "/fake-path/"
                method = "GET"
                user = self.user1
            request = FakeRequest()

        # Call the exception handler directly
        response = custom_exception_handler(FakeException("DB Query failed!"), {"request": DummyContext.request})
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data, {"detail": "An internal server error occurred. Please try again later."})

    def test_message_viewset_enforces_ownership_idor(self):
        """Test that a user cannot access another user's private messages."""
        self.message = Message.objects.create(
            sender=self.user1,
            recipient=self.user2,
            body="Hey User2"
        )
        
        # Authenticate as user2 (recipient)
        self.client.force_authenticate(user=self.user2)
        url = f"/api/messages/{self.message.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Authenticate as user1 (sender)
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Create a third user
        user3 = User.objects.create_user(username="user3", email="user3@example.com", password="Password123!")
        self.client.force_authenticate(user=user3)
        
        # User3 attempts to view User1 <-> User2 message
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_comment_viewset_enforces_edit_idor(self):
        """Test that a user cannot edit or delete another user's comment."""
        comment = Comment.objects.create(
            product=self.product,
            user=self.user2,
            body="Is this negotiable?"
        )
        
        # Authenticate as user1 (not owner of comment)
        self.client.force_authenticate(user=self.user1)
        url = f"/api/comments/{comment.id}/"
        response = self.client.patch(url, {"body": "Hacked comment"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Authenticate as owner of comment and edit it
        self.client.force_authenticate(user=self.user2)
        response = self.client.patch(url, {"body": "Negotiable?"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_atomic_checkout_success(self):
        """Verify successful atomic checkout logic."""
        self.client.force_authenticate(user=self.user2)
        url = f"/api/products/{self.product.id}/checkout/"
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that product is now inactive/sold
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_active)
        
        # Check that transaction record is created
        self.assertTrue(Transaction.objects.filter(buyer=self.user2, product=self.product).exists())
        
        # Check that seller's total_sales is incremented
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.total_sales, 1)

    def test_atomic_checkout_cannot_buy_own_product(self):
        """Verify user cannot purchase their own listing."""
        self.client.force_authenticate(user=self.user1)
        url = f"/api/products/{self.product.id}/checkout/"
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot buy your own product", response.data["detail"])

    def test_atomic_checkout_cannot_buy_inactive_product(self):
        """Verify user cannot purchase an already sold/inactive listing."""
        self.product.is_active = False
        self.product.save()
        
        self.client.force_authenticate(user=self.user2)
        url = f"/api/products/{self.product.id}/checkout/"
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("no longer available", response.data["detail"])
