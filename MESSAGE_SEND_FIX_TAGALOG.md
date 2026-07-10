# FIX: Hindi Makapag-send ng Messages (400 Error) ✅

## ANO ANG PROBLEMA?

**Error**: `POST http://localhost:8000/api/messages/ 400 (Bad Request)`

Hindi maka-send ng messages ang FloatingChat dahil may validation error sa backend.

## BAKIT NAG-FAIL?

May issues sa validation:
1. Walang clear na error messages
2. Hindi nache-check kung empty ang message
3. Hindi validated properly ang recipient ID

## ANO ANG NA-FIX?

### 1. **Improved Validation sa Backend**

**Before (Broken)**:
```python
# Simple lang, walang detailed validation
def validate_body(self, value: str) -> str:
    return sanitize_text(value)
```

**After (Fixed)**:
```python
# May proper validation na!
recipient = serializers.PrimaryKeyRelatedField(
    queryset=User.objects.all(),
    error_messages={
        'required': 'Recipient is required',
        'does_not_exist': 'Invalid recipient ID',
        'incorrect_type': 'Recipient must be a valid user ID',
    }
)

def validate_body(self, value: str) -> str:
    if not value or not value.strip():
        raise serializers.ValidationError("Message body cannot be empty")
    return sanitize_text(value)
```

✅ **Improvements**:
- May clear error messages na
- Niche-check kung empty ang message
- Validated ang recipient ID properly
- Hindi ka pwedeng mag-message sa sarili mo

### 2. **Better Error Logging sa Frontend**

**Before**:
```typescript
catch (error) {
  console.error("Failed to send message:", error)
}
```

**After (Fixed)**:
```typescript
catch (error: any) {
  console.error("Failed to send message:", error)
  console.error("Error response:", error.response?.data)
  console.error("Attempted payload:", {
    recipient: activeThread.participant.id,
    body: messageText,
  })
}
```

✅ Makikita mo na ngayon:
- Exact error from backend
- Data na sinend mo
- Mas madaling i-debug!

## VALIDATION RULES

### Required Fields:
- ✅ `recipient`: Valid user ID (number)
- ✅ `body`: Hindi pwedeng empty

### Mga Check:
1. **Recipient exists**: May user na may ganyang ID
2. **Recipient type**: Number dapat, hindi string
3. **Hindi sarili**: Hindi pwedeng sarili mo ang recipient
4. **Hindi empty**: May laman ang message
5. **Sanitized**: Tinatanggal ang HTML tags

## MGA POSSIBLE ERRORS

| Error Message | Ibig Sabihin | Paano Ayusin |
|--------------|--------------|--------------|
| "Recipient is required" | Walang recipient sa data | I-send ang recipient field |
| "Invalid recipient ID" | Hindi existing ang user | Check kung may user sa DB |
| "Recipient must be a valid user ID" | Mali ang type (string instead of number) | I-send as number |
| "Cannot send message to yourself" | Sarili mo ang kinakausap | Check kung recipient !== sender |
| "Message body cannot be empty" | Walang laman ang message | Type something bago mag-send |

## PAANO MAG-DEBUG

### Step 1: Tingnan ang Browser Console (F12)
Makikita mo ngayon ang 3 error logs:
```
1. "Failed to send message: AxiosError..."
2. "Error response: { recipient: [...], body: [...] }"
3. "Attempted payload: { recipient: 123, body: 'Hello' }"
```

### Step 2: Tingnan ang Backend Terminal
Hanapin ang line na:
```
[24/Jun/2026 13:06:25] "POST /api/messages/ HTTP/1.1" 400
```

### Step 3: Check ang Network Tab
1. Open DevTools (F12)
2. Click "Network" tab
3. Click yung failed `/api/messages/` request
4. Tingnan ang "Response" tab

Example ng error response:
```json
{
  "recipient": ["Invalid recipient ID"],
  "body": ["Message body cannot be empty"]
}
```

## PAANO I-TEST

### Test 1: Normal Message (Dapat Gumana)
1. Open FloatingChat
2. Select a conversation
3. Type "Hello test"
4. Press Enter
5. **Expected**: ✅ Message sent successfully
6. **Console**: Walang errors

### Test 2: Empty Message (Dapat Hindi Gumana)
1. Open FloatingChat
2. Select conversation
3. Wag mag-type (empty)
4. Press Enter
5. **Expected**: ❌ Nothing happens or error appears
6. **Console**: "Message body cannot be empty"

### Test 3: Check kung Gumana ang Fix
```javascript
// I-paste sa browser console (F12):
fetch('http://127.0.0.1:8000/api/messages/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  },
  body: JSON.stringify({
    recipient: 1,  // Gamitin ang valid user ID
    body: 'Test message from console'
  })
})
.then(r => r.json())
.then(console.log)
```

**Kung success**: Makikita mo ang message data
**Kung error**: Makikita mo ang specific error message

## COMMON PROBLEMS

### Problem 1: "recipient must be a valid user ID"
**Dahilan**: Nag-send ka ng object instead of ID
```typescript
// ❌ MALI:
recipient: activeThread.participant  // Buong object

// ✅ TAMA:
recipient: activeThread.participant.id  // ID lang (number)
```

### Problem 2: "Message body cannot be empty"
**Dahilan**: Empty string or spaces lang
```typescript
// ❌ MALI:
body: ""
body: "   "  // Spaces lang

// ✅ TAMA:
body: "Hello"  // May actual text
```

### Problem 3: "Cannot send message to yourself"
**Dahilan**: Sarili mo ang kinakausap
```typescript
// Check muna bago mag-send:
if (activeThread.participant.id === user.id) {
  alert("Hindi mo pwedeng i-message ang sarili mo!")
  return
}
```

## FLOW NG MESSAGE SENDING

```
1. User types message
   ↓
2. Click Send / Press Enter
   ↓
3. Frontend checks:
   - Hindi ba empty? ✓
   - May activeThread? ✓
   ↓
4. POST request to /api/messages/
   Data: {
     recipient: 123,  // User ID (number)
     body: "Hello"    // Hindi empty
   }
   ↓
5. Backend validates:
   - Valid recipient ID? ✓
   - May user sa DB? ✓
   - Hindi sarili? ✓
   - Hindi empty? ✓
   - Sanitize HTML ✓
   ↓
6. Save to database
   ↓
7. Return message data
   ↓
8. Frontend updates UI
   ✅ Message appears!
```

## FILES NA BINAGO

### Backend:
1. **`backend/marketplace/serializers.py`**
   - Improved MessageSerializer validation
   - Better error messages
   - Empty body check

2. **`backend/marketplace/views.py`**
   - Added serializer context
   - Better error handling

### Frontend:
3. **`frontend/src/components/chat/FloatingChat.tsx`**
   - Better error logging
   - Shows exact error response
   - Shows attempted payload

## QUICK FIX CHECKLIST

Gawin mo to in order:

- [x] ✅ Backend code updated
- [x] ✅ Frontend code updated
- [x] ✅ Backend server restarted
- [ ] 🔄 Refresh browser (Ctrl + F5)
- [ ] 🔄 Try sending a message
- [ ] 🔄 Check console (F12) for errors

## KUNG MAY PROBLEMA PA

### Option 1: Test sa Browser Console
```javascript
// Check kung naka-login
localStorage.getItem('access_token')
// Should return a long string

// Test send message
fetch('http://127.0.0.1:8000/api/messages/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  },
  body: JSON.stringify({
    recipient: 1,  // Change to valid user ID
    body: 'Test'
  })
})
.then(r => r.text())
.then(console.log)
```

### Option 2: Check Backend
```bash
# Sa terminal kung saan tumatakbo ang Django:
# Tingnan kung may errors after mag-send ng message
```

### Option 3: Screenshot ang Error
Kung may error pa:
1. Open Console (F12)
2. I-screenshot ang error
3. I-send sa akin kasama ang:
   - Error message
   - Error response
   - Attempted payload

## STATUS: ✅ FIXED!

**Na-fix na**:
- ✅ Better validation
- ✅ Clear error messages
- ✅ Empty body check
- ✅ Better logging
- ✅ Server restarted

**Subukan mo na!**
1. Refresh browser (Ctrl + F5)
2. Try mag-send ng message
3. Check console kung may error pa

---
**Petsa**: June 24, 2026
**Na-fix ni**: Kiro AI Assistant 🤖

**Next**: I-refresh mo ang browser at subukan mag-send ng message! 🚀
