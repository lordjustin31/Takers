# 🚀 Friends Feed Setup Guide

**Quick setup to make friends' products appear on timeline instantly!**

---

## One-Time Setup (Run These Commands Once)

### Terminal 1 - Backend Setup:

```bash
cd backend

# Step 1: Activate all inactive products
python manage.py activate_all_products

# Step 2: Approve all pending products
python manage.py approve_all_products

# Step 3: Start backend server
python manage.py runserver
```

**Expected Output:**
```
Successfully activated and approved 3 products
  - Desktop by steph
  - iPhone by lj
  ...

Successfully approved 0 products
(already approved by previous command)

Django server running at http://localhost:8000
```

### Terminal 2 - Frontend Setup:

```bash
cd frontend

# Start frontend server
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
```

---

## Testing It Works

### Test 1: Check Friends Feed Command

```bash
cd backend
python manage.py test_friends_feed your_username
```

**Expected Output:**
```
=== Testing Friends Feed for: your_username ===

Friends:
  - friend_name (ID: 2)

Products from Friends (Total: 1):
  - Desktop by friend_name ($100.00) - Posted: 2026-07-02 10:40

============================================================
```

### Test 2: Check on Browser

1. Open `http://localhost:5174`
2. Login with your username
3. Go to homepage `/`
4. Make sure **"Friends"** tab is selected (should be blue/purple gradient)
5. You should see your friends' products!

---

## How To Use

### As a User (Viewing Friends' Posts):

1. **Add Friends:**
   - Go to friend's profile page
   - Click "Add Friend" button
   - Wait for them to accept

2. **View Friends' Products:**
   - Go to homepage `/`
   - Click "Friends" tab (default)
   - See all products from friends
   - Auto-updates every 10 seconds

### As a Seller (Posting Products):

1. **Post Product:**
   - Click "Sell" button
   - Fill in details (Title, Price, Description, etc.)
   - Click "Publish"
   - **Product is instantly active and approved!**

2. **Friends See It:**
   - Product appears on friends' timeline
   - Within 0-10 seconds (auto-refresh)
   - No approval needed!

---

## Complete Test Scenario

### Scenario: Two Users Become Friends and Share Products

**Terminal (Backend):**
```bash
cd backend
python manage.py runserver
```

**Browser 1 - User A:**
1. Login as `user_a`
2. Go to User B's profile: `/shop/{user_b_id}`
3. Click "Add Friend"
4. Go to homepage `/` → "Friends" tab
5. (Wait for User B to accept and post)

**Browser 2 - User B:**
1. Login as `user_b`
2. Go to `/friends` page
3. Click "Accept" on User A's request
4. Click "Sell" button
5. Create product:
   - Title: "Test iPhone"
   - Price: 500
   - Description: "Testing friends feed"
   - Category: Electronics
6. Click "Publish"

**Browser 1 - User A (Same Window):**
1. Still on homepage "Friends" tab
2. Wait 10 seconds (auto-refresh)
3. **See User B's "Test iPhone" product!** ✨

---

## Troubleshooting

### Products Not Showing?

**Check 1: Are you friends?**
```bash
python manage.py test_friends_feed your_username
```
Should show friend in list.

**Check 2: Products activated?**
```bash
python manage.py activate_all_products
```

**Check 3: Hard refresh browser**
Press `Ctrl + F5`

**Check 4: Check browser console**
1. Press F12 (DevTools)
2. Go to "Console" tab
3. Look for errors
4. Go to "Network" tab
5. Look for `/api/products/friends_feed/`
6. Check response has products

### Common Issues:

❌ **"No friends found"**
- Go to `/friends` page
- Accept pending requests
- Or send friend request and have them accept

❌ **"No products found"**
- Run: `python manage.py activate_all_products`
- Friend posts a new product
- Wait 10 seconds

❌ **Wrong tab selected**
- Click "Friends" tab (first tab with Users icon)
- Should have blue/purple gradient

❌ **Not logged in**
- Make sure you're logged in
- Check token in localStorage
- Try logout and login again

---

## Commands Reference

### Diagnostic Commands:

```bash
# Test specific user's friends feed
python manage.py test_friends_feed username

# Check all users in database
python manage.py check_users

# Activate all inactive products
python manage.py activate_all_products

# Approve all pending products
python manage.py approve_all_products
```

### Server Commands:

```bash
# Backend server
cd backend
python manage.py runserver

# Frontend server
cd frontend
npm run dev
```

---

## How It Works

### Auto-Approval on Product Creation:

When user creates product:
```python
# In ProductViewSet.perform_create()
serializer.save(
    seller=request.user,
    moderation_status='approved',  # Auto-approved!
    is_active=True  # Active by default
)
```

### Friends Feed Query:

```python
# In ProductViewSet.friends_feed()
products = Product.objects.filter(
    seller_id__in=friend_ids,  # Only from friends
    is_active=True  # Only active products
    # No moderation check!
)
```

### Frontend Auto-Refresh:

```typescript
// In HomePage.tsx
useEffect(() => {
  fetchFeed()  // Initial fetch
  const interval = setInterval(fetchFeed, 10000)  // Every 10 seconds
  return () => clearInterval(interval)
}, [activeFilter])
```

---

## Expected Behavior

| Action | Result | Time |
|--------|--------|------|
| User posts product | Auto-approved, Active | Instant |
| Friends see product | Appears on timeline | 0-10 sec |
| Real-time updates | Auto-refresh | Every 10s |
| No approval needed | ✅ Always | Always |

---

## API Endpoints

### Friends Feed:
```
GET /api/products/friends_feed/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "title": "iPhone 13",
      "price": "500.00",
      "currency": "₱",
      "seller": {
        "id": 2,
        "username": "steph",
        "display_name": "Steph",
        "avatar_url": "...",
        "is_verified_seller": false
      },
      "created_at": "2026-07-02T10:40:00Z",
      "is_favorite": false
    }
  ]
}
```

### Create Product:
```
POST /api/products/
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "iPhone 13",
  "price": 500,
  "description": "...",
  "category": 1
}
```

**Response:**
```json
{
  "id": 1,
  "moderation_status": "approved",  // Auto-approved!
  "is_active": true,  // Active by default
  ...
}
```

---

## Success Checklist

✅ **Setup Complete:**
- [ ] Ran `activate_all_products` command
- [ ] Ran `approve_all_products` command
- [ ] Backend server running (`python manage.py runserver`)
- [ ] Frontend server running (`npm run dev`)

✅ **Friendship Working:**
- [ ] Two users are friends (status = accepted)
- [ ] Can see friend in `/friends` page
- [ ] `test_friends_feed` shows friend

✅ **Products Working:**
- [ ] Friend posts product → Auto-approved
- [ ] Product appears on timeline
- [ ] Auto-refresh every 10 seconds
- [ ] Can see in "Friends" tab

✅ **All Tests Passing:**
- [ ] `test_friends_feed` shows products
- [ ] Browser shows products on Friends tab
- [ ] Real-time updates working
- [ ] No errors in console

---

## Quick Start Commands

```bash
# One-time setup
cd backend
python manage.py activate_all_products
python manage.py approve_all_products

# Start servers (2 terminals)
# Terminal 1:
cd backend
python manage.py runserver

# Terminal 2:
cd frontend
npm run dev

# Test it works
cd backend
python manage.py test_friends_feed your_username

# Browser: http://localhost:5174
```

---

**READY TO USE!** 🚀

Everything is set up. Friends' products will now appear on timeline automatically within 10 seconds! ✨
