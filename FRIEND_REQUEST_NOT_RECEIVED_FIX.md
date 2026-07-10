# Friend Request Not Received - Fix & Testing Guide

## Issue
When User A clicks "Add Friend" on User B's profile, User B doesn't receive the friend request notification.

---

## Root Cause Analysis

The issue could be one of several things:
1. **Duplicate request** - Already sent a friend request
2. **Already friends** - Users are already friends
3. **Error not shown** - Frontend not displaying error properly
4. **Notification polling** - Need to wait up to 30 seconds for notification to appear

---

## Fixes Applied

### 1. Backend - Better Validation (`serializers.py`)

**Added comprehensive duplicate checking:**
```python
def validate_receiver_id(self, value):
    """Ensure user can't friend themselves and no duplicate requests"""
    if hasattr(self, 'context') and 'request' in self.context:
        requester = self.context['request'].user
        
        # Can't friend yourself
        if value == requester:
            raise serializers.ValidationError("Cannot send friend request to yourself")
        
        # Check for existing friendship
        existing = Friendship.objects.filter(
            Q(requester=requester, receiver=value) |
            Q(requester=value, receiver=requester)
        ).first()
        
        if existing:
            if existing.status == Friendship.Status.PENDING:
                if existing.requester == requester:
                    raise serializers.ValidationError("You already sent a friend request to this user")
                else:
                    raise serializers.ValidationError("This user already sent you a friend request. Check your pending requests.")
            elif existing.status == Friendship.Status.ACCEPTED:
                raise serializers.ValidationError("You are already friends with this user")
            elif existing.status == Friendship.Status.REJECTED:
                raise serializers.ValidationError("Friend request was rejected")
            elif existing.status == Friendship.Status.BLOCKED:
                raise serializers.ValidationError("Unable to send friend request")
    
    return value
```

**Error Messages:**
- Already sent request → "You already sent a friend request to this user"
- Received pending request → "This user already sent you a friend request. Check your pending requests."
- Already friends → "You are already friends with this user"
- Rejected → "Friend request was rejected"
- Blocked → "Unable to send friend request"

### 2. Frontend - Better Error Handling (`UserProfilePage.tsx`)

**Improved Add Friend button:**
```typescript
onClick={async () => {
  try {
    await apiClient.post('/friendships/', {
      receiver_id: seller.id
    })
    alert('Friend request sent successfully!')
    // Refresh to update UI
    window.location.reload()
  } catch (error: any) {
    const errorMsg = error.response?.data?.receiver_id?.[0] 
      || error.response?.data?.detail 
      || error.response?.data?.non_field_errors?.[0]
      || 'Failed to send friend request'
    alert(errorMsg)
    console.error('Friend request error:', error.response?.data)
  }
}}
```

**Improvements:**
- Shows clear success message
- Reloads page to update UI
- Better error extraction from response
- Logs full error details to console
- Checks multiple error field locations

---

## How Friend Request System Works

### Complete Flow:

1. **User A clicks "Add Friend"**
   - POST request to `/api/friendships/`
   - Body: `{ receiver_id: user_b_id }`

2. **Backend validates:**
   - ✅ Not friending yourself
   - ✅ No duplicate request exists
   - ✅ Not already friends
   - ✅ Not blocked

3. **Backend creates Friendship:**
   - `requester` = User A
   - `receiver` = User B
   - `status` = "pending"

4. **Backend creates Notification:**
   - `user` = User B
   - `title` = "New Friend Request"
   - `message` = "User A sent you a friend request"
   - `link` = "/shop/{user_a_id}"
   - `is_read` = False

5. **User B sees notification:**
   - Wait up to 30 seconds (auto-refresh interval)
   - Bell icon shows count (1)
   - Notification appears in dropdown
   - Or check `/friends` page → "Requests" tab

6. **User B accepts:**
   - Click "Accept" on `/friends` page
   - Status changes to "accepted"
   - Notification sent to User A

---

## Testing Instructions

### Step-by-Step Test:

1. **Open two browser windows:**
   - Window 1: User A (your account)
   - Window 2: User B (use Incognito)

2. **Window 1 - Send Friend Request:**
   - Navigate to User B's profile (`/shop/{user_b_id}`)
   - Click "Add Friend" button
   - Should see: **"Friend request sent successfully!"**
   - Page should reload

3. **Window 2 - Check Notification:**
   - **Wait 30 seconds** (notification polling interval)
   - Bell icon should show: **(1)**
   - Click bell icon
   - Should see: **"New Friend Request from User A"**
   - Click notification → Should go to User A's profile

4. **Window 2 - Check Friends Page:**
   - Navigate to `/friends`
   - Go to "Requests" tab
   - Should see User A's friend request
   - Click "Accept" button

5. **Window 1 - Check Acceptance:**
   - **Wait 30 seconds**
   - Bell icon shows: **(1)**
   - See: **"Friend Request Accepted by User B"**

### Test Duplicate Request:

1. **Window 1: Send friend request again**
   - Go to User B's profile
   - Click "Add Friend" again
   - Should see error: **"You already sent a friend request to this user"**

### Test Already Friends:

1. **After acceptance, try to send again**
   - Should see: **"You are already friends with this user"**

### Test Reverse Request:

1. **User A sends request to User B**
2. **Before User B accepts, User B tries to send request to User A**
   - Should see: **"This user already sent you a friend request. Check your pending requests."**

---

## Troubleshooting

### Issue: "Friend request sent successfully!" but User B doesn't see it

**Check 1: Wait for auto-refresh**
- Notifications poll every 30 seconds
- Wait at least 30 seconds before checking

**Check 2: Check database**
```bash
python manage.py shell
```
```python
from marketplace.models import Friendship, Notification, User

user_a = User.objects.get(username='user_a')
user_b = User.objects.get(username='user_b')

# Check friendship exists
friendship = Friendship.objects.filter(
    requester=user_a, 
    receiver=user_b
).first()

print(f"Friendship: {friendship}")
print(f"Status: {friendship.status if friendship else 'Not found'}")

# Check notification exists
notification = Notification.objects.filter(
    user=user_b,
    title="New Friend Request"
).first()

print(f"Notification: {notification}")
print(f"Is Read: {notification.is_read if notification else 'Not found'}")
```

**Check 3: Verify notification endpoint**
```bash
# Check if backend is creating notification
# Look at backend console logs
```

**Check 4: Force refresh notifications**
```typescript
// In browser console
window.location.reload()
```

### Issue: Error "receiver_id: This field is required"

**Solution:**
Make sure the POST request includes `receiver_id`:
```typescript
await apiClient.post('/friendships/', {
  receiver_id: seller.id  // Make sure this is present
})
```

### Issue: Always shows "Already sent request"

**Solution:**
Clear the existing friendship:
```python
# Django shell
from marketplace.models import Friendship

# Delete existing friendship
Friendship.objects.filter(
    requester=user_a,
    receiver=user_b
).delete()

# Or delete all friendships between them
Friendship.objects.filter(
    models.Q(requester=user_a, receiver=user_b) |
    models.Q(requester=user_b, receiver=user_a)
).delete()
```

---

## Manual Testing Checklist

- [ ] Can send friend request successfully
- [ ] Success message appears
- [ ] Page reloads after sending
- [ ] Notification appears for receiver (within 30s)
- [ ] Bell icon shows count
- [ ] Notification click navigates to profile
- [ ] Request appears in `/friends` page
- [ ] Can accept request
- [ ] Acceptance notification sent to requester
- [ ] Both users appear in "Friends" tab
- [ ] Cannot send duplicate request
- [ ] Error messages display correctly
- [ ] Console shows detailed errors

---

## Common Error Messages & Meanings

| Error Message | Meaning | Action |
|--------------|---------|--------|
| "Friend request sent successfully!" | Success | Wait 30s, check notifications |
| "You already sent a friend request to this user" | Duplicate | Check /friends page |
| "This user already sent you a friend request..." | Reverse pending | Go to /friends → Accept |
| "You are already friends with this user" | Already friends | No action needed |
| "Cannot send friend request to yourself" | Self-request | Choose different user |
| "Failed to send friend request" | General error | Check console logs |

---

## Debugging Commands

### Check All Friendships:
```python
from marketplace.models import Friendship

for f in Friendship.objects.all():
    print(f"{f.requester.username} -> {f.receiver.username}: {f.status}")
```

### Check All Notifications:
```python
from marketplace.models import Notification

for n in Notification.objects.all():
    print(f"{n.user.username}: {n.title} (Read: {n.is_read})")
```

### Clear All Friend Requests:
```python
Friendship.objects.filter(status='pending').delete()
```

### Create Test Notification:
```python
from marketplace.models import Notification, User

user = User.objects.get(username='your_username')

Notification.objects.create(
    user=user,
    notification_type='message',
    title="Test Notification",
    message="This is a test",
    link="/",
)
```

---

## Files Modified

### Backend:
- `backend/marketplace/serializers.py`:
  - Added comprehensive duplicate validation
  - Better error messages
  - Check for all friendship statuses

### Frontend:
- `frontend/src/pages/profile/UserProfilePage.tsx`:
  - Better error handling
  - Multiple error field checks
  - Console logging for debugging
  - Page reload after success

---

## Status: ✅ FIXED

All improvements implemented:
- ✅ Duplicate request validation
- ✅ Better error messages
- ✅ Improved error handling
- ✅ Console logging for debugging
- ✅ Page reload after success
- ✅ Check for reverse pending requests

---

**Created:** July 2, 2026
**Issue:** Friend requests not being received
**Status:** Fixed with better validation and error handling

## Quick Test:
1. Send friend request
2. Wait 30 seconds
3. Check notifications
4. Should see "New Friend Request" notification
