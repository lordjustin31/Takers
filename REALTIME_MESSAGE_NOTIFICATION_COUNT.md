# Real-Time Message & Notification Count Fix ✓

## Issues
1. **FloatingChat Badge:** Hardcoded `messageCount={3}` - always showing 3 kahit walang messages
2. **Notification Badge:** Already working properly with real-time updates (every 30s)

## Solution

### Fixed FloatingChat Message Count
Changed from hardcoded value to real-time unread message count.

## Implementation

### 1. Added Import in App.tsx
```typescript
import apiClient from "./api/client"
```

### 2. Added State for Unread Count
```typescript
const [unreadMessageCount, setUnreadMessageCount] = useState(0)
```

### 3. Added Real-Time Fetching (App.tsx)
```typescript
// Fetch unread message count in real-time
useEffect(() => {
  const fetchUnreadCount = async () => {
    if (!user) return
    
    try {
      const response = await apiClient.get<{ results: any[] }>('/messages/?ordering=-created_at')
      const messages = response.data.results || []
      
      // Count unread messages where current user is recipient
      const unread = messages.filter((msg: any) => 
        msg.recipient === user.id && !msg.is_read
      ).length
      
      setUnreadMessageCount(unread)
    } catch (error) {
      console.error('Failed to fetch unread message count:', error)
    }
  }
  
  if (user) {
    fetchUnreadCount()
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchUnreadCount, 5000)
    return () => clearInterval(interval)
  }
}, [user])
```

### 4. Pass to FloatingChat
```typescript
<FloatingChat messageCount={unreadMessageCount} />
```

## How It Works

### Message Count Badge:
1. **On Login:** Fetches all messages, counts unread where `recipient === current_user`
2. **Real-time Updates:** Polls every 5 seconds
3. **Automatic Update:** 
   - When you receive new messages → count increases
   - When you read messages → count decreases
   - Shows actual unread count, not hardcoded value

### Notification Count Badge (Already Working):
1. **On Login:** Fetches notifications from `/notifications/unread_count/`
2. **Real-time Updates:** Polls every 30 seconds
3. **Mark as Read:** Click "Mark all as read" → count becomes 0

## Visual Indicators

### FloatingChat Button:
```
┌──────────────┐
│   💬         │  ← Chat Icon
│      (3)     │  ← Red badge with unread count
└──────────────┘
```

### Notification Bell (Navbar):
```
┌──────────────┐
│   🔔         │  ← Bell Icon
│      (5)     │  ← Red badge with unread count
└──────────────┘
```

## Polling Intervals

| Feature | Interval | Reason |
|---------|----------|--------|
| **Message Count** | 5 seconds | More frequent for chat (users expect instant updates) |
| **Notifications** | 30 seconds | Less frequent, notifications are less urgent |

## Accuracy

### Before:
- ❌ Message badge always showed 3
- ✅ Notification badge already accurate

### After:
- ✅ Message badge shows actual unread count
- ✅ Notification badge remains accurate
- ✅ Both update in real-time
- ✅ Both reset to 0 when messages/notifications are read

## Testing

### Test Message Count:
1. **Hard refresh:** `Ctrl + F5`
2. **Check initial count:** Should show actual unread messages (or 0)
3. **Open Incognito window** → Login as different user
4. **Send message to your account** → Badge count increases within 5 seconds
5. **Read message** (open thread in FloatingChat) → Badge count decreases within 5 seconds

### Test Notification Count:
1. **Already working properly**
2. **Creates notification** (like/offer/etc) → Badge count increases within 30 seconds
3. **Click "Mark all as read"** → Badge count becomes 0

## Edge Cases Handled

### Message Count:
- ✅ Only counts messages where `recipient === current_user`
- ✅ Only counts `is_read === false`
- ✅ Doesn't count sent messages
- ✅ Updates when messages are marked as read (auto or manual)

### Notification Count:
- ✅ Backend endpoint `/notifications/unread_count/` handles counting
- ✅ Only counts notifications for current user
- ✅ Only counts `is_read === false`
- ✅ Updates when marked as read

## Performance

### Message Count Polling:
- **Network:** 1 API call every 5 seconds
- **Data Size:** Fetches all messages (could be optimized)
- **Processing:** Client-side filtering of unread messages

### Optimization Ideas (Future):
1. **Backend Endpoint:** Create `/messages/unread_count/` endpoint (like notifications)
   - Returns only count, not full message list
   - Faster response, less data transfer
2. **WebSocket:** Real-time updates without polling
3. **Incremental Updates:** Only fetch new messages since last poll

## Files Modified

### Frontend:
- `frontend/src/App.tsx`:
  - Added `apiClient` import
  - Added `unreadMessageCount` state
  - Added real-time fetching useEffect
  - Changed `messageCount={3}` to `messageCount={unreadMessageCount}`

## Status: ✅ COMPLETE

All requirements met:
- ✅ Message count badge shows actual unread count
- ✅ Real-time updates every 5 seconds
- ✅ Count increases when receiving messages
- ✅ Count decreases when reading messages
- ✅ Notification count already working properly (30s interval)
- ✅ Both badges accurate and real-time

---

**Created:** July 2, 2026
**Issue:** Hardcoded message count, need real-time accuracy
**Solution:** Real-time polling every 5 seconds with actual unread count
