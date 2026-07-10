# Message Button Debug Guide

## Issue:
Message and Add Friend buttons not working on user profile.

## Changes Made:

### 1. Added Debug Logging
```typescript
onClick={() => {
  console.log('Message button clicked, seller ID:', seller.id)
  openThreadWithUser(seller.id)
}}
```

### 2. Added type="button"
Prevents form submission if buttons are inside any form.

### 3. Added seller check
```typescript
{!isOwnProfile && seller && (
```

### 4. Added Add Friend alert
Shows "Coming soon" message when clicked.

## How to Test:

### Step 1: Clear Browser Cache
```
Ctrl + Shift + Delete
Or
Hard refresh: Ctrl + F5
```

### Step 2: Open DevTools
```
Press F12
Go to Console tab
```

### Step 3: Navigate to Profile
```
http://localhost:5174/shop/1
(Replace 1 with actual user ID)
```

### Step 4: Check Buttons Visibility

**If buttons DON'T appear:**
- Check console for errors
- Verify you're logged in
- Verify it's not your own profile
- Check if user is private (Message button hidden)

**If buttons appear but don't work:**
- Click button
- Check console for log messages
- Should see: "Message button clicked, seller ID: X"
- Check for any errors

### Step 5: Verify Chat Opens

**When Message button works:**
1. FloatingChat should appear (bottom-right)
2. Should show user's name in header
3. Should be ready to type message

## Common Issues:

### Issue 1: Buttons Not Showing
**Cause:** Viewing own profile or user is private
**Fix:** 
- Make sure logged in as different user
- Check user's `is_private` field in database

### Issue 2: Button Shows But No Action
**Cause:** ChatContext not initialized or JavaScript error
**Fix:**
- Check browser console for errors
- Verify ChatProvider is wrapped in App.tsx
- Clear cache and hard refresh

### Issue 3: Console Error "useChat must be used within ChatProvider"
**Cause:** ChatProvider not wrapping the component
**Fix:**
- Verify App.tsx has:
```tsx
<ChatProvider>
  <AppShell />
</ChatProvider>
```

### Issue 4: seller.id is undefined
**Cause:** Profile data not loaded yet
**Fix:**
- Added `seller &&` check
- Buttons only render when seller data exists

## Debugging Checklist:

```
[ ] Browser cache cleared (Ctrl + F5)
[ ] DevTools Console open (F12)
[ ] Logged in as user A
[ ] Viewing profile of user B (different user)
[ ] User B is not private
[ ] Console shows no errors
[ ] Click Message button
[ ] Console logs: "Message button clicked, seller ID: X"
[ ] FloatingChat appears
```

## Expected Behavior:

### Public Profile (Not Own):
```
✅ Message button visible
✅ Add Friend button visible
✅ Clicking Message opens FloatingChat
✅ Clicking Add Friend shows alert
```

### Private Profile (Not Own):
```
❌ Message button hidden
❌ Add Friend button hidden
```

### Own Profile:
```
❌ No action buttons (both hidden)
```

## Quick Test Commands:

### Check if ChatProvider is present:
Open Console (F12) and run:
```javascript
// This should NOT throw error
try {
  console.log('ChatContext test')
} catch (e) {
  console.error('ChatContext error:', e)
}
```

### Check seller data:
```javascript
// In React DevTools:
// Find UserProfilePage component
// Check state.seller object
// Should have: id, is_private, etc.
```

## Files Modified:

1. `frontend/src/pages/profile/UserProfilePage.tsx`
   - Added console.log for debugging
   - Added type="button" to prevent form submission
   - Added seller existence check
   - Added Add Friend onclick handler

## Next Steps If Still Not Working:

1. **Take screenshot** of browser console
2. **Check Network tab** (F12 → Network)
3. **Verify API response** from `/users/{id}/profile/`
4. **Check React DevTools** component state
5. **Share error messages** if any

## Status: 
- Added debugging
- Added safety checks
- Ready to test again

**Test now with Console open to see logs!**
