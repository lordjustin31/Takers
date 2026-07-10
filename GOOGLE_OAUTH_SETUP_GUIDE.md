# Google OAuth Setup Guide

## Overview
Your website already has Google OAuth authentication implemented! This guide walks you through getting the credentials and configuring everything.

## Part 1: Create Google Cloud Project & Get OAuth Credentials

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account
3. Click the **project selector** at the top left
4. Click **NEW PROJECT**
5. Enter a project name (e.g., "My Website Marketplace")
6. Click **CREATE**
7. Wait for the project to be created (you'll see a notification)

### Step 2: Enable Google+ API
1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and click **ENABLE**

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **OAuth client ID**
4. If prompted to configure consent screen first:
   - Click **CONFIGURE CONSENT SCREEN**
   - Choose **External** (unless you're with a Google Workspace organization)
   - Click **CREATE**
   - Fill in the basic info:
     - **App name**: "My Website Marketplace"
     - **User support email**: Your email
     - **Developer contact info**: Your email
   - Click **SAVE AND CONTINUE** through all sections
   - Click **BACK TO DASHBOARD**

### Step 4: Create the OAuth Client ID
1. Go back to **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Select **Web application**
4. Fill in the form:
   - **Name**: "My Website App"
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for local development)
     - `http://127.0.0.1:5173` (alternative localhost)
     - Your production domain (e.g., `https://mywebsite.com`)
   - **Authorized redirect URIs**:
     - `http://localhost:5173` (for local development)
     - `http://127.0.0.1:5173` (alternative localhost)
     - `https://mywebsite.com` (your production domain)
5. Click **CREATE**
6. You'll see a popup with your credentials. **Keep this window open!**

## Part 2: Configure Environment Variables

### Backend Setup (.env)

In your `backend/.env` file, add these Google OAuth variables:

```env
GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<YOUR_CLIENT_SECRET>
GOOGLE_REDIRECT_URI=http://localhost:5173
```

**To get your credentials:**
1. From the Google OAuth credentials popup, copy the **Client ID** and paste it into `GOOGLE_CLIENT_ID`
2. Copy the **Client secret** and paste it into `GOOGLE_CLIENT_SECRET`
3. Keep `GOOGLE_REDIRECT_URI` as shown for development

**For production**, update:
```env
GOOGLE_REDIRECT_URI=https://yourdomain.com
```

### Frontend Setup (.env)

In your `frontend/.env` file, add:

```env
VITE_GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID>.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173
```

**For production**, update:
```env
VITE_GOOGLE_REDIRECT_URI=https://yourdomain.com
```

## Part 3: Test Your Setup

### Local Testing

1. **Start your backend:**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start your frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to login page:**
   - Go to `http://localhost:5173`
   - Find the "Continue with Google" button
   - Click it

4. **What should happen:**
   - You'll be redirected to Google login
   - After login, Google redirects back with an authorization code
   - Your app exchanges this code for tokens
   - You're logged in!

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Google sign-in is not configured yet" | Check that `VITE_GOOGLE_CLIENT_ID` is in frontend `.env` and server restarted |
| "Google token exchange failed" | Check that backend `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct |
| Redirect URI mismatch error | Make sure the URI you use matches exactly what's registered in Google Cloud Console |
| "Email not available" | Some Google accounts don't share email in OAuth - this is rare, usually works |

## Part 4: Production Deployment

### Before deploying:

1. **Update environment variables:**
   - Backend: `GOOGLE_REDIRECT_URI=https://yourdomain.com`
   - Frontend: `VITE_GOOGLE_REDIRECT_URI=https://yourdomain.com`

2. **In Google Cloud Console:**
   - Go to Credentials
   - Edit the OAuth 2.0 Client ID
   - Add your production domain to both:
     - **Authorized JavaScript origins**: `https://yourdomain.com`
     - **Authorized redirect URIs**: `https://yourdomain.com`

3. **Test:**
   - After deploying, try the Google login on your production URL
   - Make sure everything works before going live

## How the Flow Works (Technical Overview)

```
User clicks "Continue with Google"
    ↓
Frontend calls startGoogleAuth()
    ↓
Redirects to Google OAuth consent page
    ↓
User approves
    ↓
Google redirects to your app with authorization code
    ↓
Frontend captures code from URL
    ↓
Frontend calls backend /auth/google/ with code
    ↓
Backend exchanges code for access token using Google API
    ↓
Backend fetches user profile from Google
    ↓
Backend creates/updates user in database
    ↓
Backend returns JWT tokens
    ↓
Frontend stores tokens and logs user in
```

## Files Involved

- **Frontend**: `src/auth/AuthContext.tsx` - OAuth logic
- **Backend**: `marketplace/auth_views.py:GoogleAuthView` - Handles OAuth callback
- **Backend**: `marketplace/services/google_oauth.py` - Google API interactions

## Next Steps

1. Create your Google Cloud project (follow Part 1)
2. Copy credentials to `.env` files (Part 2)
3. Test locally (Part 3)
4. Deploy with production settings (Part 4)

Need help with any step? Let me know!
