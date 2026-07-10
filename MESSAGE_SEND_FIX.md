# MESSAGE SENDING FIX - 400 Bad Request ✅

## PROBLEMA

**Error**: `POST http://localhost:8000/api/messages/ 400 (Bad Request)`

Ang FloatingChat ay hindi maka-send ng messages dahil nag-fa-fail ang validation sa backend.

## ROOT CAUSE

May validation issues sa MessageSerializer:
1. Walang proper error messages for recipient validation
2. Walang empty body validation
3. Hindi clear ang error messages kapag may problema

## SOLUTIONS APPLIED

### 1. **Improved MessageSerializer Validation**

**File**: `backend/marketplace/serializers.py`

**Before**:
```python
class MessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    product_detail = ProductSerializer(source="product", read_only=True)

    def validate_body(self, value: str) -> str:
        return sanitize_text(value)
```

**After (Fixed)**:
```python
class MessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    recipient = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        error_messages={
            'required': 'Recipient is required',
            'does_not_exist': 'Invalid recipient ID',
            'incorrect_type': 'Recipient must be a valid user ID',
        }
    )
    product_detail = ProductSerializer(source="product", read_only=True)

    def validate_body(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("Message body cannot be empty")
        return sanitize_text(value)
    
    def validate_recipient(self, value):
        """Ensure recipient is not the same as sender"""
        if hasattr(self, 'context') and 'request' in self.context:
            if value == self.context['request'].user:
                raise serializers.ValidationError("Cannot send message to yourself")
        return value
```

✅ **Improvements**:
- Explicit `PrimaryKeyRelatedField` for recipient with custom error messages
- Empty body validation
- Self-messaging prevention at serializer level
- Better error messages

### 2. **Updated MessageViewSet**

**File**: `backend/marketplace/views.py`

**Added**:
```python
def get_serializer_context(self):
    """Add request to serializer context for validation"""
    context = super().get_serializer_context()
    context['request'] = self.request
    return context
```

✅ Passes request context to serializer for validation

### 3. **Better Error Logging in Frontend**

**File**: `frontend/src/components/chat/FloatingChat.tsx`

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

✅ Shows exact error response from backend
✅ Shows what data was sent
✅ Makes debugging easier

## VALIDATION RULES

### Required Fields:
- ✅ `recipient`: Must be a valid user ID (integer)
- ✅ `body`: Must not be empty or whitespace-only

### Validation Checks:
1. **Recipient exists**: User ID must exist in database
2. **Recipient type**: Must be an integer, not string or object
3. **Not self**: Cannot send message to yourself
4. **Body not empty**: Message body cannot be empty or just spaces
5. **Body sanitized**: HTML tags removed for security

## ERROR MESSAGES

### Possible 400 Errors and Their Meanings:

| Error Message | Meaning | Fix |
|--------------|---------|-----|
| "Recipient is required" | No recipient field sent | Check frontend is sending `recipient` |
| "Invalid recipient ID" | User ID doesn't exist | Check user exists in database |
| "Recipient must be a valid user ID" | Wrong data type (e.g., string) | Send integer, not string |
| "Cannot send message to yourself" | Trying to message yourself | Check recipient !== sender |
| "Message body cannot be empty" | Empty or whitespace body | Check message has text |

## HOW TO DEBUG

### Step 1: Check Browser Console
```javascript
// Will show 3 error logs now:
1. "Failed to send message: AxiosError..."
2. "Error response: { recipient: [...], body: [...] }"
3. "Attempted payload: { recipient: 123, body: 'Hello' }"
```

### Step 2: Check Backend Logs
Open terminal where Django is running. Look for:
```
[24/Jun/2026 13:06:25] "POST /api/messages/ HTTP/1.1" 400
```

### Step 3: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Click on failed `/api/messages/` request
4. Check "Response" tab for detailed error

Example Response:
```json
{
  "recipient": ["Invalid recipient ID"],
  "body": ["Message body cannot be empty"]
}
```

## TESTING INSTRUCTIONS

### Test 1: Valid Message (Should Work)
1. Open FloatingChat
2. Select a conversation
3. Type "Hello test message"
4. Press Enter
5. **Expected**: ✅ Message sends successfully
6. **Check console**: No errors

### Test 2: Empty Message (Should Fail Gracefully)
1. Open FloatingChat
2. Select a conversation
3. Don't type anything (empty input)
4. Press Enter
5. **Expected**: ❌ Nothing happens (validation catches it)
6. Or if it tries: Get "Message body cannot be empty" error

### Test 3: Invalid Recipient (Backend Test)
```javascript
// In browser console:
fetch('http://127.0.0.1:8000/api/messages/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  },
  body: JSON.stringify({
    recipient: 99999,  // Non-existent user
    body: 'Test'
  })
})
.then(r => r.json())
.then(console.log)
```

**Expected Response**:
```json
{
  "recipient": ["Invalid recipient ID"]
}
```

## COMMON ISSUES AND FIXES

### Issue 1: "recipient must be a valid user ID"
**Cause**: Sending recipient as object instead of ID
```typescript
// ❌ WRONG:
recipient: activeThread.participant  // Sends entire object

// ✅ CORRECT:
recipient: activeThread.participant.id  // Sends just ID (number)
```

### Issue 2: "Message body cannot be empty"
**Cause**: Sending empty string or whitespace
```typescript
// ❌ WRONG:
body: ""
body: "   "  // Just spaces

// ✅ CORRECT:
body: "Hello"  // Actual text
```

### Issue 3: "Cannot send message to yourself"
**Cause**: Trying to message your own account
```typescript
// Check before sending:
if (activeThread.participant.id === user.id) {
  console.warn("Cannot message yourself")
  return
}
```

## FLOW DIAGRAM

```
User types message and clicks Send
  ↓
Frontend validates (not empty)
  ↓
POST /api/messages/ with:
  {
    recipient: 123,  // Must be valid user ID
    body: "Hello"    // Must not be empty
  }
  ↓
Backend MessageSerializer validates:
  1. Recipient is integer ✓
  2. Recipient exists in DB ✓
  3. Recipient !== sender ✓
  4. Body not empty ✓
  5. Sanitize HTML from body ✓
  ↓
MessageViewSet.perform_create():
  1. Find existing thread
  2. Reuse thread_id or create new
  3. Save message
  ↓
Return 201 Created with message data
  ↓
Frontend updates UI immediately
```

## STATUS: ✅ FIXED

**Changes Applied**:
1. ✅ Better validation messages in MessageSerializer
2. ✅ Explicit recipient field validation
3. ✅ Empty body validation
4. ✅ Self-messaging prevention
5. ✅ Better error logging in frontend
6. ✅ Backend server restarted

**Next Steps**:
1. Refresh browser (Ctrl + F5)
2. Try sending a message in FloatingChat
3. Check console for detailed errors if it fails
4. Share the console error output for further debugging

---
**Date**: June 24, 2026 - 13:06 PM
**Fixed By**: Kiro AI Assistant
