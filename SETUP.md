# Takers Marketplace - Setup Guide

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth Client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
     - (Add your production URL when deploying)
   - Add authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
   - Click "Create"
   - Copy the **Client ID** and **Client Secret**

### 2. Backend Configuration

1. Navigate to the `backend` folder
2. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

3. Open `.env` and add your Google credentials:
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   GOOGLE_REDIRECT_URI=http://localhost:5173
   ```

4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Create a superuser (optional):
   ```bash
   python manage.py createsuperuser
   ```

7. Start the backend server:
   ```bash
   python manage.py runserver
   ```

### 3. Frontend Configuration

1. Navigate to the `frontend` folder
2. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

3. Open `.env` and add your Google Client ID:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   VITE_GOOGLE_REDIRECT_URI=http://localhost:5173
   ```

4. Install Node dependencies:
   ```bash
   npm install
   ```

5. Start the frontend development server:
   ```bash
   npm run dev
   ```

### 4. Test the Application

1. Open your browser and navigate to `http://localhost:5173`
2. Click "Sign in" or "Continue with Google"
3. Complete the Google OAuth flow
4. You should be redirected back and logged in

## Common Issues

### Google OAuth Not Working

**Problem**: "redirect_uri_mismatch" error

**Solution**: 
- Make sure the redirect URI in Google Cloud Console matches exactly with your `VITE_GOOGLE_REDIRECT_URI`
- Common redirect URIs:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`

**Problem**: "Access blocked: This app's request is invalid"

**Solution**:
- Add both JavaScript origins AND redirect URIs in Google Cloud Console
- Make sure the Google+ API is enabled

**Problem**: "Invalid client" error

**Solution**:
- Double-check your Client ID and Client Secret
- Make sure there are no extra spaces in your `.env` files
- Restart both backend and frontend servers after changing `.env` files

### Backend Issues

**Problem**: CORS errors

**Solution**:
- Make sure `CORS_ALLOWED_ORIGINS` in backend `.env` includes your frontend URL
- Default is `http://localhost:5173,http://127.0.0.1:5173`

**Problem**: Database errors

**Solution**:
- Run `python manage.py migrate` again
- Delete `db.sqlite3` and run migrations again for a fresh start

### Frontend Issues

**Problem**: API connection errors

**Solution**:
- Verify `VITE_API_URL` in frontend `.env` is `http://localhost:8000`
- Make sure the backend server is running

**Problem**: Environment variables not loading

**Solution**:
- Restart the Vite dev server after changing `.env`
- Make sure your `.env` file is in the `frontend` folder, not the root

## Production Deployment

When deploying to production:

1. Update `GOOGLE_REDIRECT_URI` to your production URL
2. Add your production URL to Google Cloud Console authorized URIs
3. Update `DJANGO_ALLOWED_HOSTS` to include your domain
4. Update `CORS_ALLOWED_ORIGINS` to include your production frontend URL
5. Set `DJANGO_DEBUG=False`
6. Use a strong `DJANGO_SECRET_KEY`
7. Consider using PostgreSQL instead of SQLite
8. Set up AWS S3 for media file storage (optional)

## Need Help?

- Check the Django logs for backend issues
- Check browser console for frontend issues
- Verify all environment variables are set correctly
- Make sure both servers are running
