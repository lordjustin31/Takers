# Friends Feed Feature - Testing Guide

## Overview
This guide will help you test the Friends Feed functionality to ensure that products posted by your friends automatically appear on your timeline/homepage.

---

## Prerequisites

Make sure both backend and frontend are running:
- **Backend:** `python manage.py runserver` (Port 8000)
- **Frontend:** `npm run dev` (Port 5174)

---

## Test Scenario: Friends Feed Workflow

### Step 1: Create Two Test Accounts

#### Account A (Your Account):
1. Open browser: `http://localhost:5174`
2. Click "Sign Up" or "Register"
3. Create account:
   - **Username:** `user_a`
   - **Email:** `usera@test.com`
   - **Password:** `password123`
4. Login with these credentials

#### Account B (Friend Account):
1. Open **Incognito/Private window**: `http://localhost:5174`
2. Click "Sign Up" or "Register"
3. Create account:
   - **Username:** `user_b`
   - **Email:** `userb@test.com`
   - **Password:** `password123`
4. Login with these credentials

---

### Step 2: Send Friend Request

**From Account A (Normal Window):**
1. Search for `user_b` (use search bar in navbar)
2. Click on `user_b` profile
3. Click **"Add Friend"** button
4. You should see: "Friend request sent!"

---

### Step 3: Accept Friend Request

**From Account B (Incognito Window):**
1. Check notifications (bell icon) or go to profile
2. You should see friend request from `user_a`
3. Click **"Accept"** button

**Alternative Method:**
You can accept via Django admin or database:
```sql
UPDATE marketplace_friendship 
SET status = 'accepted' 
WHERE (requester_id = <user_a_id> AND receiver_id = <user_b_id>)
   OR (requester_id = <user_b_id> AND receiver_id = <user_a_id>);
```

---

### Step 4: Post Product as Friend (User B)

**From Account B (Incognito Window):**
1. Click **"Sell"** button (+ icon in navbar)
2. Fill in product details:
   - **Title:** "Test Product from Friend"
   - **Description:** "This is a test product to verify friends feed"
   - **Price:** 1000
   - **Category:** Select any
   - **Location:** Your location
   - **Upload Image:** Optional
3. Click **"Publish"**
4. Product should be created

**If Moderation is Enabled:**
You need to approve the product:
```bash
# Via Django admin or command:
python manage.py shell
```
```python
from marketplace.models import Product
product = Product.objects.latest('created_at')
product.moderation_status = 'approved'
product.save()
```

---

### Step 5: Verify Product Appears on User A's Timeline

**From Account A (Normal Window):**
1. Go to **Home Page** (click Home in navbar or logo)
2. Make sure **"Friends"** tab is active (should be default)
3. **Wait up to 10 seconds** (auto-refresh interval)
4. You should see the product "Test Product from Friend" posted by `user_b`

**Expected Result:**
```
┌─────────────────────────────────────────┐
│ 👤 user_b                  ✓ Verified   │
│ 🕐 Just now • 📍 Location               │
├─────────────────────────────────────────┤
│ Test Product from Friend                │
│ ₱1000                                   │
│ This is a test product to verify...     │
├─────────────────────────────────────────┤
│ [Product Image]                         │
├─────────────────────────────────────────┤
│ ❤️ Save  💬 Message  🔗 Share          │
│                     [View Details] →    │
└─────────────────────────────────────────┘
```

---

### Step 6: Verify Filter Tabs Work

**Test Each Filter:**

1. **Friends Tab (Active):**
   - Should show only products from `user_b` (your friend)
   - Should NOT show products from other users

2. **All Items Tab:**
   - Click "All Items" button
   - Should show all marketplace products (including `user_b`'s product)

3. **Trending Tab:**
   - Click "Trending" button
   - Should show products sorted by view count

4. **New Arrivals Tab:**
   - Click "New Arrivals" button
   - Should show newest products first

---

## Troubleshooting

### Issue 1: Product Not Appearing in Friends Feed

**Check 1 - Friendship Status:**
```python
# Django shell
from marketplace.models import Friendship, User

user_a = User.objects.get(username='user_a')
user_b = User.objects.get(username='user_b')

friendships = Friendship.objects.filter(
    models.Q(requester=user_a, receiver=user_b) |
    models.Q(requester=user_b, receiver=user_a)
)

for f in friendships:
    print(f"Status: {f.status}")  # Should be 'accepted'
```

**Check 2 - Product Status:**
```python
# Django shell
from marketplace.models import Product

product = Product.objects.latest('created_at')
print(f"Seller: {product.seller.username}")  # Should be 'user_b'
print(f"Is Active: {product.is_active}")  # Should be True
print(f"Moderation: {product.moderation_status}")  # Should be 'approved'
```

**Check 3 - API Response:**
Open browser console (F12) and check Network tab:
- Look for request to `/api/products/friends_feed/`
- Check response data
- Should see product in results array

### Issue 2: "Friends" Tab Not Showing

**Check HomePage.tsx:**
- Make sure `activeFilter` state includes `"friends"` type
- Default should be `"friends"`
- Check if Users icon is imported

### Issue 3: 401 Unauthorized Error

**Solution:**
- Make sure you're logged in
- Check if authentication token is valid
- Try logout and login again

---

## API Endpoint Testing

You can test the endpoint directly:

### Using cURL:
```bash
# Get access token first
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"user_a","password":"password123"}'

# Use token to fetch friends feed
curl http://localhost:8000/api/products/friends_feed/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Using Postman:
1. POST `http://localhost:8000/api/auth/login/`
   - Body: `{"username":"user_a","password":"password123"}`
   - Get `access` token from response

2. GET `http://localhost:8000/api/products/friends_feed/`
   - Headers: `Authorization: Bearer YOUR_TOKEN`
   - Should return products from friends only

---

## Expected Behavior Summary

| Scenario | Expected Result |
|----------|----------------|
| Friend posts product | Appears in Friends tab within 10 seconds |
| Non-friend posts product | Does NOT appear in Friends tab |
| Non-friend posts product | DOES appear in All Items tab |
| Friend without products | Friends tab shows "No posts from friends yet" |
| Not logged in | Cannot access friends feed (401 error) |
| Product not approved | Does NOT appear in any feed |
| Product inactive | Does NOT appear in any feed |

---

## Real-Time Updates

The feed auto-refreshes every **10 seconds**:
- You don't need to manually refresh the page
- New friend posts appear automatically
- Changes to products update automatically

**To test real-time:**
1. Have both windows open (User A and User B)
2. User B posts new product
3. User A's feed should update within 10 seconds
4. Watch the feed - no manual refresh needed!

---

## Database Queries for Debugging

### Check all friendships:
```sql
SELECT 
    f.id,
    u1.username as requester,
    u2.username as receiver,
    f.status,
    f.created_at
FROM marketplace_friendship f
JOIN marketplace_user u1 ON f.requester_id = u1.id
JOIN marketplace_user u2 ON f.receiver_id = u2.id
ORDER BY f.created_at DESC;
```

### Check friend's products:
```sql
SELECT 
    p.id,
    p.title,
    u.username as seller,
    p.is_active,
    p.moderation_status,
    p.created_at
FROM marketplace_product p
JOIN marketplace_user u ON p.seller_id = u.id
WHERE p.seller_id IN (
    -- Get friends of user_a
    SELECT receiver_id FROM marketplace_friendship WHERE requester_id = <user_a_id> AND status = 'accepted'
    UNION
    SELECT requester_id FROM marketplace_friendship WHERE receiver_id = <user_a_id> AND status = 'accepted'
)
ORDER BY p.created_at DESC;
```

---

## Success Checklist

- ✅ Two accounts created
- ✅ Friend request sent
- ✅ Friend request accepted
- ✅ Product posted by friend
- ✅ Product appears in Friends tab
- ✅ Product does NOT appear for non-friends
- ✅ Auto-refresh works (10s interval)
- ✅ All filter tabs work correctly
- ✅ Empty state shows proper message

---

## Production Considerations

Before deploying to production:

1. **Moderation Workflow:**
   - Decide if products need manual approval
   - Set up admin interface for moderation
   - Consider auto-approval for verified sellers

2. **Performance:**
   - Add pagination for large friend lists
   - Cache friend relationships
   - Optimize database queries with indexes

3. **Notifications:**
   - Notify users when friends post new products
   - Add push notifications for mobile

4. **Privacy:**
   - Allow users to hide posts from feed
   - Add "unfollow" option for friends

---

**Last Updated:** July 2, 2026
**Feature:** Friends Feed - Social Marketplace Timeline
**Status:** Ready for Testing
