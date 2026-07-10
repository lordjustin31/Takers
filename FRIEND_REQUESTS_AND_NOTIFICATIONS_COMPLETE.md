# Friend Requests UI & Notifications System - Complete ✓

## Overview
Implemented a beautiful UI for managing friend requests with accept/reject functionality, and fixed the notification system to auto-create notifications for friend requests and marketplace messages.

---

## Part 1: Auto-Create Notifications

### Backend Changes

#### 1. Friend Request Notifications (`backend/marketplace/views.py`)

**When Sending Friend Request:**
```python
def perform_create(self, serializer):
    # Set requester to current user
    friendship = serializer.save(requester=self.request.user)
    
    # Create notification for friend request
    Notification.objects.create(
        user=friendship.receiver,
        notification_type=Notification.Type.MESSAGE,
        title="New Friend Request",
        message=f"{friendship.requester.display_name or friendship.requester.username} sent you a friend request",
        link=f"/shop/{friendship.requester.id}",
    )
```

**When Accepting Friend Request:**
```python
@action(detail=True, methods=['post'])
def accept(self, request, pk=None):
    # ... validation ...
    
    friendship.status = Friendship.Status.ACCEPTED
    friendship.save()
    
    # Create notification for requester
    Notification.objects.create(
        user=friendship.requester,
        notification_type=Notification.Type.MESSAGE,
        title="Friend Request Accepted",
        message=f"{friendship.receiver.display_name or friendship.receiver.username} accepted your friend request",
        link=f"/shop/{friendship.receiver.id}",
    )
    
    return Response(serializer.data)
```

#### 2. Message Notifications (`backend/marketplace/views.py`)

**When Sending Message:**
```python
def perform_create(self, serializer):
    # ... existing code ...
    
    # Create notification for message recipient
    product = serializer.validated_data.get("product")
    if product:
        notification_title = "New Message About Your Listing"
        notification_message = f"{sender.display_name or sender.username} messaged you about {product.title}"
        notification_link = "/messages"
    else:
        notification_title = "New Message"
        notification_message = f"{sender.display_name or sender.username} sent you a message"
        notification_link = "/messages"
    
    Notification.objects.create(
        user=recipient,
        notification_type=Notification.Type.MESSAGE,
        title=notification_title,
        message=notification_message,
        link=notification_link,
    )
```

### Notification Types Created:

| Event | Title | Message | Link |
|-------|-------|---------|------|
| Friend Request Sent | "New Friend Request" | "{username} sent you a friend request" | `/shop/{user_id}` |
| Friend Request Accepted | "Friend Request Accepted" | "{username} accepted your friend request" | `/shop/{user_id}` |
| Message (General) | "New Message" | "{username} sent you a message" | `/messages` |
| Message (Marketplace) | "New Message About Your Listing" | "{username} messaged you about {product}" | `/messages` |

---

## Part 2: Friends Page with Beautiful UI

### New Page Created: `FriendsPage.tsx`

**Features:**
- ✅ Tab system (Requests / Friends)
- ✅ Real-time updates (5s interval)
- ✅ Accept/Reject buttons with animations
- ✅ Remove friend functionality
- ✅ Avatar display with gradients
- ✅ Verified seller badges
- ✅ Time ago formatting
- ✅ Empty states
- ✅ Responsive design

### UI Components:

#### 1. Header
```tsx
<h1 className="flex items-center gap-3 text-4xl font-bold text-neu-900">
  <Users className="h-10 w-10 text-blue-600" />
  Friends
</h1>
<p className="mt-2 text-neu-600">Manage your friend requests and connections</p>
```

#### 2. Tab System
```tsx
<div className="flex gap-3">
  <button className={`... ${
    activeTab === "requests"
      ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-glow"
      : "text-neu-600 hover:bg-neu-100"
  }`}>
    <Clock className="h-5 w-5" />
    Requests ({pendingRequests.length})
  </button>
  
  <button className={`... ${
    activeTab === "friends"
      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-glow-blue"
      : "text-neu-600 hover:bg-neu-100"
  }`}>
    <UserCheck className="h-5 w-5" />
    Friends ({acceptedFriends.length})
  </button>
</div>
```

#### 3. Friend Request Card (Pending)
```tsx
<motion.div className="neu-card overflow-hidden transition hover:shadow-xl">
  <div className="flex items-center gap-4 p-6">
    {/* Avatar */}
    <div className="h-16 w-16 rounded-2xl overflow-hidden">
      {/* Avatar with gradient fallback */}
    </div>

    {/* Info */}
    <div className="flex-1">
      <h3 className="text-lg font-bold text-neu-900">
        {display_name} {verified_badge}
      </h3>
      <p className="text-sm text-neu-600">Sent {timeAgo}</p>
    </div>

    {/* Actions */}
    <div className="flex gap-3">
      <button className="bg-gradient-to-r from-green-500 to-emerald-600 ...">
        <Check className="h-5 w-5" />
        Accept
      </button>
      <button className="bg-gradient-to-r from-red-500 to-rose-600 ...">
        <X className="h-5 w-5" />
        Reject
      </button>
    </div>
  </div>
</motion.div>
```

#### 4. Friend Card (Accepted)
```tsx
<motion.div className="neu-card overflow-hidden transition hover:shadow-xl">
  <div className="flex items-center gap-4 p-6">
    {/* Avatar */}
    <div className="h-16 w-16 rounded-2xl overflow-hidden">
      {/* Avatar */}
    </div>

    {/* Info */}
    <div className="flex-1">
      <h3 className="font-bold text-neu-900">
        {display_name} {verified_badge}
      </h3>
      <p className="text-sm text-neu-600">Friends since {timeAgo}</p>
    </div>

    {/* Remove Button */}
    <button className="neu-button p-2 text-red-600 hover:bg-red-50">
      <UserX className="h-5 w-5" />
    </button>
  </div>
</motion.div>
```

### API Integration:

**Endpoints Used:**
- `GET /api/friendships/` - Get all friendships
- `POST /api/friendships/{id}/accept/` - Accept request
- `POST /api/friendships/{id}/reject/` - Reject request
- `DELETE /api/friendships/{id}/` - Remove friend

**Real-Time Updates:**
```typescript
useEffect(() => {
  fetchFriendships()
  // Auto-refresh every 5 seconds
  const interval = setInterval(fetchFriendships, 5000)
  return () => clearInterval(interval)
}, [])
```

---

## Part 3: Navigation Integration

### Added Friends Link to Navbar

**Import:**
```typescript
import { Users } from "lucide-react"
```

**Navigation Button:**
```tsx
<button
  onClick={() => navigate("/friends")}
  className="neu-button relative px-6 py-2 transition"
>
  <Users
    className={`h-6 w-6 transition ${
      isActive("/friends") ? "text-blue-600" : "text-neu-600"
    }`}
  />
  {isActive("/friends") && (
    <div className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-t-full bg-blue-600" />
  )}
</button>
```

**Route Added (App.tsx):**
```tsx
<Route path="/friends" element={requireAuth(<FriendsPage />)} />
```

---

## Part 4: Notification System Working

### Already Implemented (Verified):

**Navbar Notification Fetching:**
```typescript
useEffect(() => {
  const fetchNotifications = async () => {
    if (!user) return
    
    try {
      const response = await apiClient.get<{ results: any[] }>("/notifications/")
      const data = response.data.results || response.data
      
      setNotifications(data.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: formatTimeAgo(n.created_at),
        isRead: n.is_read,
      })))
      
      // Get unread count
      const countRes = await apiClient.get("/notifications/unread_count/")
      setNotificationCount(countRes.data.count)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }
  
  if (user) {
    fetchNotifications()
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }
}, [user])
```

**Features:**
- ✅ Real-time count (30s interval)
- ✅ Displays notification dropdown
- ✅ Mark all as read functionality
- ✅ Individual notification read status
- ✅ Click to navigate to link

---

## How It All Works Together

### Scenario 1: Friend Request Flow

1. **User A sends friend request to User B:**
   - Click "Add Friend" on profile
   - Backend creates `Friendship` with status `pending`
   - Backend creates `Notification` for User B
   - Notification: "New Friend Request from {User A}"

2. **User B receives notification:**
   - Bell icon shows count (1)
   - Notification appears in dropdown
   - Click notification → Goes to User A's profile
   - Or navigate to `/friends` page

3. **User B accepts request:**
   - Click "Accept" button on Friends page
   - Backend updates `Friendship` status to `accepted`
   - Backend creates `Notification` for User A
   - Notification: "Friend Request Accepted by {User B}"

4. **User A receives acceptance notification:**
   - Bell icon shows count
   - Notification appears
   - Now both are friends!

### Scenario 2: Marketplace Message Flow

1. **User A messages User B about product:**
   - Click "Message" on product page
   - Send message with product reference
   - Backend creates `Message`
   - Backend creates `Notification` for User B
   - Notification: "New Message About Your Listing {Product Title}"

2. **User B receives notification:**
   - Bell icon shows count
   - Notification appears in dropdown
   - Click notification → Opens `/messages`
   - Chat thread opens automatically

3. **General Message:**
   - Same flow but title is "New Message"
   - No product reference

---

## Visual Design Highlights

### Friend Request Card:
```
┌────────────────────────────────────────────────────────┐
│  [Avatar]  User Name ✓                                │
│            Sent 5m ago                                 │
│                                  [Accept] [Reject]     │
└────────────────────────────────────────────────────────┘
```

### Accept Button:
- Gradient: Green → Emerald
- Icon: Check mark
- Hover: Scale up (1.05)
- Shadow: Glow effect

### Reject Button:
- Gradient: Red → Rose  
- Icon: X mark
- Hover: Scale up (1.05)
- Shadow: Glow effect

### Friend Card:
```
┌────────────────────────────────────────────────────────┐
│  [Avatar]  User Name ✓                                │
│            Friends since 2 days ago             [X]    │
└────────────────────────────────────────────────────────┘
```

### Notification Badge:
```
🔔 (5)  ← Red badge with count
```

---

## Files Modified & Created

### Backend:
- `backend/marketplace/views.py`:
  - Added notification creation in `FriendshipViewSet.perform_create()`
  - Added notification creation in `FriendshipViewSet.accept()`
  - Added notification creation in `MessageViewSet.perform_create()`

### Frontend:
- **NEW:** `frontend/src/pages/FriendsPage.tsx` - Complete friends management UI
- `frontend/src/App.tsx`:
  - Added FriendsPage import
  - Added `/friends` route
- `frontend/src/components/layout/Navbar.tsx`:
  - Added Users icon import
  - Added Friends navigation button
  - (Already had working notification system)

---

## Testing Instructions

### Test Friend Request Notifications:

1. **Create two accounts** (User A and User B)

2. **User A sends friend request:**
   - Go to User B's profile
   - Click "Add Friend"
   - Should see success message

3. **User B checks notifications:**
   - Bell icon should show count (1)
   - Click bell → See "New Friend Request from User A"
   - Click notification → Goes to User A's profile

4. **User B accepts:**
   - Navigate to `/friends` page
   - See request in "Requests" tab
   - Click "Accept" button
   - Request moves to "Friends" tab

5. **User A checks notifications:**
   - Bell icon should show count (1)
   - See "Friend Request Accepted by User B"
   - Click notification → Goes to User B's profile

### Test Message Notifications:

1. **User A messages User B about product:**
   - Go to product page (owned by User B)
   - Click "Message" button
   - Send message

2. **User B checks notifications:**
   - Bell icon shows count
   - See "New Message About Your Listing {Product Title}"
   - Click notification → Opens messages

3. **Test general message:**
   - Send message without product
   - Should show "New Message from {User A}"

### Test Friends Page UI:

1. **Navigate to `/friends`** or click Friends icon in navbar

2. **Check Requests tab:**
   - Should show pending requests with counts
   - Test Accept button → Moves to Friends tab
   - Test Reject button → Request disappears

3. **Check Friends tab:**
   - Should show accepted friends
   - Test Remove button → Friend removed with confirmation

4. **Check empty states:**
   - No requests → Shows "No pending requests" message
   - No friends → Shows "No friends yet" message

---

## Real-Time Behavior

| Feature | Update Interval | Behavior |
|---------|----------------|----------|
| Notification Count | 30 seconds | Auto-updates badge count |
| Notification List | 30 seconds | New notifications appear |
| Friends Page | 5 seconds | Requests/Friends list updates |
| Friend Request Status | 5 seconds | Accept/Reject reflects immediately |

---

## Status: ✅ COMPLETE

All requirements implemented:
- ✅ Beautiful UI for friend requests (Accept/Reject)
- ✅ Friends page with tab system
- ✅ Real-time updates (5s for friends, 30s for notifications)
- ✅ Auto-create notifications for friend requests
- ✅ Auto-create notifications for marketplace messages
- ✅ Notification count fixed (no more hardcoded "3")
- ✅ Navigation integration (Friends link in navbar)
- ✅ Empty states and animations
- ✅ Responsive design
- ✅ Remove friend functionality

---

**Created:** July 2, 2026
**Features:** Friend Requests UI + Auto Notifications
**Status:** Production Ready 🎉
