import secrets
from typing import Optional

from django.utils.text import slugify
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User
from .serializers import UserMeSerializer, UserMeUpdateSerializer
from .throttles import AuthRateThrottle
from .services.google_oauth import (
    exchange_code_for_tokens,
    fetch_userinfo,
    verify_access_token,
    verify_id_token,
)


def build_unique_username(base: str) -> str:
    cleaned = slugify(base) or "taker"
    cleaned = cleaned.replace("-", "")
    candidate = cleaned[:24]
    while User.objects.filter(username=candidate).exists():
        suffix = secrets.randbelow(10000)
        candidate = f"{cleaned[:20]}{suffix}"
    return candidate


def extract_profile(
    payload: dict, fallback: Optional[dict] = None
) -> tuple[str, str, str]:
    data = fallback or {}
    email = payload.get("email") or data.get("email")
    name = payload.get("name") or data.get("name") or ""
    picture = payload.get("picture") or data.get("picture") or ""
    return email, name, picture


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        access_token = request.data.get("access_token")
        code = request.data.get("code")
        redirect_uri = request.data.get("redirect_uri")
        if not access_token and not code:
            return Response(
                {"detail": "Provide access_token or code"}, status=400
            )

        id_payload = {}
        userinfo = {}
        if code:
            try:
                print(f"[INFO] GoogleAuthView: code={code[:20]}..., redirect_uri={redirect_uri}")
                tokens = exchange_code_for_tokens(code, redirect_uri)
                print("[SUCCESS] Token exchange successful")
            except ValueError as exc:
                print(f"[ERROR] Token exchange failed: {exc}")
                return Response({"detail": str(exc)}, status=400)
            access_token = tokens.get("access_token")
            id_token = tokens.get("id_token")
            if id_token:
                try:
                    id_payload = verify_id_token(id_token)
                    print(f"[SUCCESS] ID token verified: {id_payload.get('email')}")
                except ValueError:
                    print("[WARNING] ID token verification failed")
                    id_payload = {}
            if access_token:
                try:
                    verify_access_token(access_token)
                    print("[SUCCESS] Access token verified")
                except ValueError:
                    print("[WARNING] Access token verification failed")
                try:
                    userinfo = fetch_userinfo(access_token)
                    print(f"[SUCCESS] Got userinfo: {userinfo.get('email')}")
                except ValueError:
                    print("[ERROR] Failed to fetch userinfo")
                    userinfo = {}
        else:
            try:
                verify_access_token(access_token)
            except ValueError:
                return Response({"detail": "Invalid Google access token"}, status=400)
            try:
                userinfo = fetch_userinfo(access_token)
            except ValueError:
                return Response({"detail": "Unable to fetch Google profile"}, status=400)

        email, name, picture = extract_profile(id_payload, userinfo)
        print(f"[INFO] Profile: email={email}, name={name}")
        if not email:
            return Response({"detail": "Email not available"}, status=400)

        user = User.objects.filter(email=email).first()
        if not user:
            print(f"[INFO] Creating new user: {email}")
            base = name or email.split("@", 1)[0]
            user = User.objects.create(
                username=build_unique_username(base),
                email=email,
                display_name=name,
                avatar_url=picture,
            )
            user.set_unusable_password()
            user.save(update_fields=["password"])
        else:
            print(f"[INFO] Updating existing user: {email}")
            updates = {}
            if name and user.display_name != name:
                updates["display_name"] = name
            if picture and user.avatar_url != picture:
                updates["avatar_url"] = picture
            if updates:
                for key, value in updates.items():
                    setattr(user, key, value)
                user.save(update_fields=list(updates.keys()))

        print(f"[SUCCESS] Auth success: user {user.id} - {user.email}")
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "display_name": user.display_name,
                    "avatar_url": user.avatar_url,
                    "is_verified_seller": user.is_verified_seller,
                    "is_staff": user.is_staff,
                },
            }
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""

        if not username or not email or not password:
            return Response({"detail": "Username, email, and password are required"}, status=400)

        if User.objects.filter(email__iexact=email).exists():
            return Response({"detail": "Email already registered"}, status=400)

        if User.objects.filter(username__iexact=username).exists():
            return Response({"detail": "Username already taken"}, status=400)

        user = User.objects.create_user(username=username, email=email, password=password)
        user.display_name = username
        user.save(update_fields=["display_name"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "display_name": user.display_name,
                    "avatar_url": user.avatar_url,
                    "is_verified_seller": user.is_verified_seller,
                    "is_staff": user.is_staff,
                },
            }
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token required"}, status=400)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({"detail": "Invalid refresh token"}, status=400)
        return Response(status=204)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserMeSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        """Update current user's profile"""
        user = request.user
        try:
            serializer = UserMeUpdateSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                # Refresh user from DB to get updated avatar URL
                user.refresh_from_db()
                return Response(UserMeSerializer(user, context={'request': request}).data)
            return Response(serializer.errors, status=400)
        except Exception as e:
            import logging
            logger = logging.getLogger("django.security")
            logger.error(f"Profile update/upload failed for user {user.username}: {str(e)}")
            return Response(
                {"detail": "Upload failed. Please try again with a valid image file."}, 
                status=500
            )


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = (attrs.get("username") or "").strip()
        if identifier and "@" in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
            if user:
                attrs["username"] = user.username
        return super().validate(attrs)


class ThrottledTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    throttle_classes = [AuthRateThrottle]


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [AuthRateThrottle]
