# Takers Marketplace

A modern marketplace platform built with a Django REST backend and a React + Vite frontend.

## Tech Stack

### Backend
- Django 6.0
- Django REST Framework
- SimpleJWT for JWT auth
- django-filter for API filtering
- django-storages + boto3 for optional AWS S3 media storage
- PostgreSQL (optional) or SQLite fallback

### Frontend
- React with TypeScript
- Vite
- Tailwind CSS
- Framer Motion for animated UI transitions
- React Router DOM for SPA routing
- Axios for API communication

## Core Features

- User authentication with JWT and Google OAuth
- Sell item wizard with multipart image uploads
- AWS S3-compatible media storage support
- Product listing, search, filtering, and detail pages
- Seller public shop profile with average rating and reviews
- Review engine with authenticated review submission
- Message/chat hub and offers system
- Dispute workflow and admin moderation
- Admin analytics dashboard for marketplace metrics
- Auth throttling and request protection on sensitive endpoints

## Backend Setup

1. Create a Python virtual environment and activate it.
2. Install dependencies:
   ```bash
   python -m pip install -r backend/requirements.txt
   ```
3. Configure environment variables.
4. Run migrations:
   ```bash
   cd backend
   python manage.py migrate
   ```
5. Start the backend server:
   ```bash
   python manage.py runserver
   ```

### Backend Environment Variables

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG` (`True` or `False`)
- `DJANGO_ALLOWED_HOSTS`
- `POSTGRES_HOST` (optional)
- `POSTGRES_DB` (optional)
- `POSTGRES_USER` (optional)
- `POSTGRES_PASSWORD` (optional)
- `POSTGRES_PORT` (optional)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `CORS_ALLOWED_ORIGINS`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_STORAGE_BUCKET_NAME`
- `AWS_S3_REGION_NAME`

> AWS S3 storage is enabled automatically when `AWS_STORAGE_BUCKET_NAME` is set.

## Frontend Setup

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Create a `.env` file in the frontend folder and set:
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_REDIRECT_URI=http://localhost:5173
   ```
3. Run the frontend dev server:
   ```bash
   npm run dev
   ```

## Public Seller Profile

- Route: `/shop/:id`
- Displays seller metadata, average rating, and active listings
- Includes a review form for authenticated users who are not the profile owner

## Notes

- The backend supports both SQLite and PostgreSQL. Use `POSTGRES_HOST` to enable Postgres.
- Uploads are stored locally by default and can be switched to AWS S3 via environment variables.
- Review submission requires an authenticated user and is throttled by DRF.
