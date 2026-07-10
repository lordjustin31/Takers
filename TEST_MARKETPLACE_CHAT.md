# Test Guide - Marketplace Chat with Product Titles

## Quick Test (5 minutes)

### Setup:
```cmd
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Test Steps:

#### Test 1: Product Title in Chat (2 min)

1. **Open browser:** `http://localhost:5174`
2. **Login as user**
3. **Go to Marketplace**
4. **Click any product**
5. **Click "Chat with Seller" button**

**Expected Result:**
```
✅ FloatingChat opens
✅ Header shows: "[Product Title]"
✅ Subtitle shows: "with [Seller Name]"
✅ Tab is "Marketplace" (not "General")
```

**Example:**
```
┌─────────────────────────────────┐
│ 💬 iPhone 13 Pro Max 256GB     │ ← Product title
│    with Juan Dela Cruz          │ ← Seller name
│    [Marketplace] tab selected   │
└─────────────────────────────────┘
```

#### Test 2: Message Persistence (1 min)

1. **Type message:** "Is this available?"
2. **Click Send**
3. **Type another:** "Can you do ₱40k?"
4. **Click Send**
5. **Check browser console** (F12)

**Expected Result:**
```
✅ Both messages sent successfully
✅ Both stay in "Marketplace" tab
✅ Product ID included in both (check Network tab)
```

#### Test 3: Real-Time Updates (2 min)

**Need 2 browsers:**
- Browser A: Normal window (User 1)
- Browser B: Incognito (User 2)

**Steps:**

1. **Browser A:** Login as User 1
2. **Browser B:** Login as User 2  
3. **Browser A:** Go to product, click "Chat with Seller"
4. **Browser A:** Send: "Hello!"
5. **Browser B:** Open chat (click FloatingChat button)
6. **Browser B:** Should see "Hello!" within 2 seconds ✅
7. **Browser B:** Reply: "Hi there!"
8. **Browser A:** Should see reply within 2 seconds ✅ (WITHOUT sending anything)

**Success Criteria:**
```
✅ Messages appear within 2 seconds
✅ No need to send message to trigger update
✅ Both sides update automatically
✅ Product title visible in both windows
```

---

## Detailed Test Scenarios:

### Scenario A: New Marketplace Conversation

**User:** Buyer (You)
**Goal:** Start conversation about product

1. Browse marketplace
2. Find interesting product: "Gaming Laptop RTX 3060"
3. Click product to view details
4. Click "Chat with Seller"
5. FloatingChat opens:
   - ✅ Title: "Gaming Laptop RTX 3060"
   - ✅ Subtitle: "with [Seller]"
   - ✅ Marketplace tab active
6. Type: "Is this negotiable?"
7. Send message
8. Check thread list:
   - ✅ Shows product title
   - ✅ "Marketplace" badge visible
   - ✅ Message preview correct

### Scenario B: Existing Conversation

**User:** Buyer returning to conversation
**Goal:** Continue previous chat

1. Open FloatingChat
2. Click "Marketplace" tab
3. Find previous conversation
4. Thread shows:
   - ✅ Product title (not just seller name)
   - ✅ Last message preview
   - ✅ Time stamp
5. Click to open
6. Type new message: "When can we meet?"
7. Send
8. Backend check:
   - ✅ Message has product ID
   - ✅ Message type is "marketplace"

### Scenario C: Real-Time Seller Response

**User:** Buyer waiting for reply
**Goal:** See incoming message without refresh

1. Send message to seller
2. **Don't do anything** - just wait
3. Seller replies (on another device)
4. Within 2 seconds:
   - ✅ New message appears
   - ✅ No page refresh needed
   - ✅ Auto-scrolls to bottom
   - ✅ Message is readable

### Scenario D: Multiple Products

**User:** Buyer chatting about 3 different products
**Goal:** Keep them organized

1. Chat with Seller A about "iPhone"
2. Chat with Seller B about "MacBook"  
3. Chat with Seller C about "iPad"
4. Open "Marketplace" tab
5. See 3 threads:
   - ✅ iPhone conversation
   - ✅ MacBook conversation
   - ✅ iPad conversation
6. Each shows product title, not seller name
7. Click each one:
   - ✅ Correct product in header
   - ✅ Correct seller in subtitle
   - ✅ All messages preserved

---

## Visual Verification Checklist:

### FloatingChat Header:
```
When Marketplace Thread Active:
┌─────────────────────────────────┐
│ 💬 [Product Title]             │ ✅ Product name
│    with [Seller Name]           │ ✅ Seller name in subtitle
└─────────────────────────────────┘

When General Thread Active:
┌─────────────────────────────────┐
│ 💬 [Person Name]               │ ✅ Person name only
│    Active now                   │ ✅ Status text
└─────────────────────────────────┘
```

### Thread List (Marketplace Tab):
```
┌────────────────────────────────────┐
│ 📱 Product Title 1      [Badge]   │ ✅ Product title
│    Seller: Last message...         │ ✅ Seller name in preview
│    2m ago                          │ ✅ Time
│                                    │
│ 💻 Product Title 2      [Badge]   │ ✅ Product title
│    You: Your message...            │ ✅ "You:" for own messages
│    1h ago                          │ ✅ Time
└────────────────────────────────────┘
```

### Message View:
```
┌────────────────────────────────────┐
│ ← Back to chats                    │
│                                    │
│ ○ Seller message bubble            │ ✅ Seller messages left
│                                    │
│            Your message bubble ○   │ ✅ Your messages right
│                                    │
│ ○ Another seller message           │ ✅ Real-time updates
│                                    │
│ [Type a message...] [Send]         │ ✅ Input at bottom
└────────────────────────────────────┘
```

---

## Common Issues & Solutions:

### Issue 1: Product Title Not Showing
**Symptoms:**
- Shows seller name instead of product title
- "Marketplace" badge present but wrong title

**Check:**
1. Open browser console (F12)
2. Check Network tab for `/messages/` request
3. Look for `product_detail` in response
4. If missing, backend issue

**Solution:**
```typescript
// Should see in response:
{
  "product_detail": {
    "id": 123,
    "title": "iPhone 13 Pro Max 256GB",
    "price": "45000"
  }
}
```

### Issue 2: Messages Not Appearing Real-Time
**Symptoms:**
- Need to send message to see replies
- Refresh required to see new messages

**Check:**
1. Open browser console
2. Watch for `/messages/` requests every 2 seconds
3. Should see continuous polling

**Solution:**
- Make sure FloatingChat is open
- Check for JavaScript errors in console
- Verify not in offline mode

### Issue 3: Product ID Not Persisting
**Symptoms:**
- First message is "marketplace" type
- Second message becomes "general" type

**Check:**
1. Send 2 messages
2. Check backend database:
```sql
SELECT id, body, product_id, message_type FROM marketplace_message 
ORDER BY created_at DESC LIMIT 5;
```

**Expected:**
```
id | body              | product_id | message_type
---+-------------------+------------+-------------
5  | Second message    | 123        | marketplace
4  | First message     | 123        | marketplace
```

---

## Debug Commands:

### Check Messages in Database:
```cmd
cd backend
python manage.py shell
```

```python
from marketplace.models import Message

# Get latest messages
messages = Message.objects.all().order_by('-created_at')[:10]
for msg in messages:
    print(f"{msg.sender.username} -> {msg.recipient.username}")
    print(f"  Type: {msg.message_type}")
    print(f"  Product: {msg.product.title if msg.product else 'None'}")
    print(f"  Body: {msg.body}")
    print("---")
```

### Check Product Associations:
```python
from marketplace.models import Product

# Find product with messages
product = Product.objects.get(id=1)
print(f"Product: {product.title}")
print(f"Messages: {product.messages.count()}")

for msg in product.messages.all():
    print(f"  {msg.sender.username}: {msg.body}")
```

### Test Real-Time Polling:
Open browser console and paste:
```javascript
// Watch for message updates
let lastCount = 0
setInterval(async () => {
  const res = await fetch('/api/messages/')
  const data = await res.json()
  const count = data.results.length
  if (count !== lastCount) {
    console.log(`✅ Messages updated: ${lastCount} -> ${count}`)
    lastCount = count
  }
}, 2000)
```

---

## Success Indicators:

After testing, you should see:

✅ **Product titles in marketplace chats**
✅ **Seller names in subtitles** 
✅ **"Marketplace" badge on threads**
✅ **Messages appear within 2 seconds**
✅ **No manual refresh needed**
✅ **Product ID in all messages**
✅ **Proper tab categorization**

---

## Quick Verification (30 seconds):

1. Open product page
2. Click "Chat with Seller"
3. Look at header - should see **product title** ✅
4. Send test message
5. Open another browser (incognito)
6. Login as seller
7. Check messages - should appear in **2 seconds** ✅

**If both work: ALL GOOD! 🎉**

---

## Files Changed:

1. `frontend/src/components/chat/FloatingChat.tsx`
   - Added productId to ThreadSummary
   - Updated header to show product title
   - Updated thread list to show product title
   - Fixed real-time update logic
   - Persist product ID throughout conversation

---

## Build Status: ✅ SUCCESS

```
✓ 2228 modules transformed.
✓ built in 1.13s
```

All TypeScript compiled successfully!

---

## Ready to Test! 🚀

Start dev server and test with 2 browser windows for full real-time experience!
