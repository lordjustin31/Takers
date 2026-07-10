# Google OAuth Implementation & Testing Guide

## 1️⃣ Testing Google Login Locally

### Start Your Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
python manage.py runserver
```
Expected output: `Starting development server at http://127.0.0.1:8000/`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Expected output: `Local: http://localhost:5173/`

### Test the Login Flow

1. **Open your app:**
   - Go to `http://localhost:5173` in your browser

2. **Find the login page:**
   - Look for the authentication/login section
   - You should see buttons for:
     - Username/Password login
     - "Continue with Google" button

3. **Click "Continue with Google":**
   - You'll be redirected to Google's login page
   - Google will ask for permission to access your profile

4. **Sign in with your Google account:**
   - Enter your Google credentials
   - Grant permission when asked

5. **Expected result:**
   - Google redirects back to your app
   - You should see: "✅ Logged in successfully"
   - Your profile appears in the app

### If Something Goes Wrong

Check these common issues:

| Error | What to Check |
|-------|---------------|
| "Redirect URI mismatch" | Make sure `http://localhost:5173` is registered in Google Cloud Console |
| "Client ID not recognized" | Restart frontend server after updating .env |
| "Access Denied" | Check that your app's credentials are correct in .env |
| Stuck on Google login | Check browser console (F12) for errors |

## 2️⃣ How Google OAuth Works in Your App

### The Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User Clicks "Continue with Google"                 │
│ Location: AuthPage.tsx                                       │
│ Action: Calls startGoogleAuth()                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Redirect to Google                                  │
│ Location: AuthContext.tsx - startGoogleAuth()               │
│ URL: https://accounts.google.com/o/oauth2/v2/auth?          │
│      client_id=YOUR_CLIENT_ID&                              │
│      redirect_uri=http://localhost:5173&                    │
│      response_type=code&                                     │
│      scope=openid email profile                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: User Signs In at Google                             │
│ Action: User enters Google credentials                       │
│ Google shows: "Let this app access your profile?"           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Google Redirects Back                               │
│ URL: http://localhost:5173?code=AUTHORIZATION_CODE          │
│ Location: Frontend captures code from URL                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Frontend Sends Code to Backend                      │
│ Location: AuthContext.tsx - useEffect                       │
│ API Call: POST /api/auth/google/                            │
│ Body: {                                                      │
│   "code": "AUTHORIZATION_CODE",                             │
│   "redirect_uri": "http://localhost:5173"                   │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Backend Exchanges Code for Tokens                   │
│ Location: backend/marketplace/auth_views.py - GoogleAuthView│
│ Action:                                                      │
│  1. Takes authorization code from frontend                  │
│  2. Calls Google's token endpoint                           │
│  3. Exchanges code for: id_token, access_token, refresh_token│
│                                                              │
│ Google OAuth Service: marketplace/services/google_oauth.py  │
│ Function: exchange_code_for_tokens()                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Backend Verifies Token & Gets User Info            │
│ Actions:                                                     │
│  1. Verifies id_token with Google                          │
│  2. Fetches user profile from Google using access_token     │
│  3. Extracts: email, name, profile_picture                 │
│                                                              │
│ Function: verify_id_token(), fetch_userinfo()              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 8: Backend Finds or Creates User                       │
│ Logic:                                                       │
│  ├─ Search for user by email                               │
│  ├─ If found: Update display_name & avatar_url             │
│  └─ If new: Create user with unique username               │
│                                                              │
│ Special: User gets unusable password (can't login normally) │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 9: Generate JWT Tokens                                 │
│ Using: django-rest-framework-simplejwt                      │
│ Creates:                                                     │
│  - access_token: Short-lived (15 min default)              │
│  - refresh_token: Long-lived (can get new access token)    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 10: Send Tokens Back to Frontend                       │
│ Response: {                                                  │
│   "access": "eyJhbGc...",  ← Short-lived JWT               │
│   "refresh": "eyJhbGc...", ← Long-lived JWT                │
│   "user": {                                                  │
│     "id": 1,                                                 │
│     "email": "user@gmail.com",                              │
│     "username": "user",                                      │
│     "display_name": "User Name",                            │
│     "avatar_url": "https://...",                            │
│     "is_verified_seller": false,                            │
│     "is_staff": false                                        │
│   }                                                          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 11: Frontend Stores Tokens & Updates State             │
│ Location: AuthContext.tsx - loginWithGoogle()              │
│ Actions:                                                     │
│  1. Stores tokens in localStorage (via authStorage)         │
│  2. Sets accessToken state                                  │
│  3. Sets refreshToken state                                 │
│  4. Sets user state                                          │
│  5. Cleans up URL (removes ?code=...)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 12: User is Logged In! ✅                              │
│ Frontend now has:                                            │
│  - User profile information                                  │
│  - JWT tokens for authenticated requests                    │
│  - Can access protected API endpoints                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Files and Functions

**Frontend:**
- [AuthContext.tsx](../frontend/src/auth/AuthContext.tsx)
  - `startGoogleAuth()` - Initiates OAuth flow
  - `loginWithGoogle()` - Handles the callback
  
- [AuthPage.tsx](../frontend/src/pages/auth/AuthPage.tsx)
  - "Continue with Google" button

**Backend:**
- [marketplace/auth_views.py](../backend/marketplace/auth_views.py)
  - `GoogleAuthView.post()` - Handles OAuth callback from frontend

- [marketplace/services/google_oauth.py](../backend/marketplace/services/google_oauth.py)
  - `exchange_code_for_tokens()` - Exchanges authorization code for tokens
  - `verify_id_token()` - Verifies Google's ID token
  - `fetch_userinfo()` - Gets user profile from Google
  - `verify_access_token()` - Validates access token

## 3️⃣ Production Deployment Setup

### Before Deploying

1. **Get your production domain:**
   - Example: `https://mywebsite.com` or `https://marketplace.example.com`

2. **Register with Google Cloud Console:**
   - Go to Google Cloud Console > Credentials
   - Edit your OAuth 2.0 Client ID
   - Add to **Authorized JavaScript origins**:
     ```
     https://yourdomain.com
     www.yourdomain.com (if needed)
     ```
   - Add to **Authorized redirect URIs**:
     ```
     https://yourdomain.com
     ```

3. **Update Environment Variables:**

   **Backend `.env`:**
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com
   DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   ```

   **Frontend `.env.production`:**
   ```env
   VITE_API_URL=https://yourdomain-api.com/api
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_GOOGLE_REDIRECT_URI=https://yourdomain.com
   ```

4. **Update CORS Settings (if different domain):**
   
   Backend `.env`:
   ```env
   CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

5. **SSL/HTTPS Required:**
   - Google OAuth requires HTTPS in production
   - Get an SSL certificate (Let's Encrypt is free)
   - Redirect HTTP → HTTPS

### Deployment Checklist

- [ ] Domain registered
- [ ] SSL certificate installed
- [ ] Backend environment variables updated
- [ ] Frontend environment variables updated
- [ ] Credentials registered in Google Cloud Console
- [ ] Backend deployed and running
- [ ] Frontend built and deployed
- [ ] Test Google login on production domain
- [ ] Monitor logs for errors

## 4️⃣ Additional Features & Customization

### How to Make Google Login Required

If you want to force Google login instead of allowing username/password:

**In AuthPage.tsx:**
```typescript
// Option 1: Only show Google button
// Comment out the email/password form

// Option 2: Disable other login methods but keep them visible
disabled={true}
```

### Storing Additional Google Data

Right now, your app stores:
- Email
- Display name
- Avatar URL

To store more data (like Google ID), modify `GoogleAuthView` in `auth_views.py`:

```python
# In GoogleAuthView.post():
if not user:
    user = User.objects.create(
        username=build_unique_username(base),
        email=email,
        display_name=name,
        avatar_url=picture,
        # Add custom fields here:
        # google_id=userinfo.get("sub"),  # if you add this field to User model
    )
```

### Linking Google Accounts to Existing Users

Current behavior: 
- If email exists → Use existing account
- If email new → Create new account

To require linking confirmation:
- Add a linking flow in AuthPage
- Show user both accounts before merging
- Let user choose which to keep

### Auto-Logout on Google Account Removal

If user removes your app from their Google account:
- Google's refresh token becomes invalid
- Your app still has the old JWT tokens
- User can still access your app until JWT expires

To handle this:
- Add periodic token validation
- Logout if validation fails

### Scopes and Permissions

Currently using: `openid email profile`

To add more scopes (e.g., access Google Drive):
```typescript
// In AuthContext.tsx - startGoogleAuth()
scope: "openid email profile https://www.googleapis.com/auth/drive"
```

Then handle these in backend.

## 5️⃣ Troubleshooting & Debugging

### Enable Debug Logs

**Backend:**
```python
# In settings.py or manage.py shell:
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
Open browser DevTools (F12) and check Console tab for errors.

### Common Errors & Solutions

#### Error: "The Redirect URI provided does not match registered URI"
```
Solution: 
1. Check your redirect URI in Google Cloud Console
2. Make sure it matches exactly: http://localhost:5173
3. Check spelling and trailing slashes
4. Restart frontend server after updating .env
```

#### Error: "Invalid Client" or "Client not found"
```
Solution:
1. Check GOOGLE_CLIENT_ID in backend .env
2. Check VITE_GOOGLE_CLIENT_ID in frontend .env
3. Make sure they match (same value)
4. Check they're not expired in Google Cloud
```

#### Error: "Access Denied" or "Invalid Scope"
```
Solution:
1. Check your scopes: openid email profile
2. Make sure these are enabled in Google API settings
3. Try removing extra scopes temporarily
```

#### User email is empty
```
Solution:
1. Some Google accounts don't share email
2. Try a different Google account
3. Check user's Google privacy settings
```

### Local Testing Checklist

- [ ] Backend running at http://127.0.0.1:8000/
- [ ] Frontend running at http://localhost:5173/
- [ ] .env files have correct credentials
- [ ] Console shows no CORS errors (F12)
- [ ] Google Cloud Console has http://localhost:5173 registered
- [ ] Can see "Continue with Google" button
- [ ] Clicking button redirects to Google
- [ ] Can sign in with Google account
- [ ] Redirects back and shows user profile

## Need Help?

If you get stuck:
1. Check the [Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
2. Look at your browser console (F12) for error messages
3. Check backend logs: `python manage.py tail` (if using Django)
4. Verify credentials in Google Cloud Console match your .env files
