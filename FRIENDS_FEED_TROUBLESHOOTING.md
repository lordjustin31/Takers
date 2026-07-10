# Friends Feed - Auto-Display Products

## How It Works Now

**When a friend posts a product, it AUTOMATICALLY appears on your timeline!**

### Key Changes:
1. ✅ **Auto-Approved**: All new products are automatically approved when posted
2. ✅ **No Moderation**: Friends feed shows ALL active products from friends
3. ✅ **Real-Time**: Updates every 10 seconds automatically
4. ✅ **Instant Display**: Friend posts → Appears on your timeline immediately

---

## Quick Setup

### Step 1: Make Sure You're Friends
1. Go to friend's profile
2. Click "Add Friend"
3. Friend accepts request
4. You're now friends! ✨

### Step 2: Friend Posts Product
1. Friend clicks "Sell" button
2. Fills in product details
3. Clicks "Publish"
4. **Product is AUTO-APPROVED and ACTIVE**

### Step 3: See It On Your Timeline
1. Go to homepage `/`
2. Make sure "Friends" tab is selected (default)
3. Wait up to 10 seconds for auto-refresh
4. **Friend's product appears!** 🎉

---

## Testing Commands

### Test Your Friends Feed
```bash
python manage.py test_friends_feed your_username
```

**Shows:**
- Your friends list
- ALL products from friends
- Why products might not appear

### Approve Old Products (One-Time)
```bash
python manage.py approve_all_products
```

**Only needed once for old products that were pending!**

---

## Common Issues

### Issue 1: Not seeing friend's product
**Check:**
- ✅ Are you actually friends? (status = accepted)
- ✅ Is product active? (should be by default)
- ✅ Is "Friends" tab selected on homepage?
- ✅ Waited 10 seconds for auto-refresh?

**Solution:**
```bash
python manage.py test_friends_feed your_username
```

### Issue 2: Friendship not accepted
**Symptom:** Friend request still pending

**Solution:**
1. Go to `/friends` page
2. Check "Requests" tab
3. Click "Accept"

### Issue 3: Old products not showing
**Symptom:** Products posted before this fix

**Solution (One-Time):**
```bash
python manage.py approve_all_products
```

---

## How Friends Feed Works

### Backend Logic (`views.py`):

```python
def friends_feed(self, request):
    # 1. Get accepted friends
    friendships = Friendship.objects.filter(
        Q(requester=user, status='accepted') |
        Q(receiver=user, status='accepted')
    )
    
    # 2. Get ALL active products from friends (no moderation check!)
    products = Product.objects.filter(
        seller_id__in=friend_ids,
        is_active=True  # Only requirement!
    )
```

### Auto-Approval on Create:

```python
def perform_create(self, serializer):
    # Products are auto-approved immediately!
    serializer.save(
        seller=self.request.user,
        moderation_status='approved'
    )
```

### Frontend Auto-Refresh:

```typescript
// Fetches friends feed every 10 seconds
useEffect(() => {
  fetchFeed()
  const interval = setInterval(fetchFeed, 10000)
  return () => clearInterval(interval)
}, [activeFilter])
```

---

## Complete Test Scenario

### Setup Two Users and Test:

**Terminal 1 - Backend:**
```bash
cd backend
python manage.py runserver
```

**Terminal 2 - Testing:**
```bash
cd backend

# Test user A's feed
python manage.py test_friends_feed user_a
```

**Browser - User A:**
1. Login as user_a
2. Go to user_b's profile
3. Click "Add Friend"
4. Wait for acceptance

**Browser - User B:**
1. Login as user_b
2. Go to `/friends`
3. Click "Accept" on user_a's request
4. Click "Sell" button
5. Create a product and publish

**Browser - User A:**
1. Go to homepage `/`
2. "Friends" tab should be selected (default)
3. Wait 10 seconds
4. **See user_b's product!** ✨

---

## Expected Behavior

| Action | Result | Time |
|--------|--------|------|
| Friend posts product | Auto-approved | Instant |
| Product appears on feed | Automatic | 0-10 seconds |
| Updates in real-time | Auto-refresh | Every 10s |
| No manual approval needed | ✅ Auto | Always |

---

## Debugging

### Check Backend API Directly:

**Get your friends feed:**
```bash
# Login first to get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_user","password":"your_pass"}'

# Get friends feed
curl http://localhost:8000/api/products/friends_feed/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "results": [
    {
      "id": 1,
      "title": "Friend's Product",
      "price": "100.00",
      "seller": {
        "username": "friend_username"
      }
    }
  ]
}
```

### Check Browser Console:

1. Open homepage
2. Press F12 (DevTools)
3. Go to Network tab
4. Look for `/api/products/friends_feed/`
5. Check response has products

---

## Success Criteria

✅ **Working when:**
- Friend posts → Product auto-approved
- You're friends → See their products
- Homepage Friends tab → Shows all friend products
- Auto-refresh → Updates every 10 seconds
- No manual approval needed

❌ **Not working if:**
- Not actually friends (check `/friends` page)
- Friendship still pending (need to accept)
- Product not active (should be by default)
- Wrong tab selected (need "Friends" tab)

---

## Quick Commands Reference

```bash
# Test friends feed
python manage.py test_friends_feed username

# Approve old products (one-time)
python manage.py approve_all_products

# Create test users (if needed)
python manage.py create_admin

# Check database
python manage.py shell
```

---

**Status:** ✅ FIXED - Products auto-approved and appear immediately
**Date:** July 2, 2026
**Changes:** Auto-approval + No moderation check in friends feed
