# 🚀 QUICK TEST GUIDE - Image Fixes

## STEP-BY-STEP TESTING

### ✅ Test 1: Profile Photo (2 minutes)
1. Open browser → http://localhost:5174/
2. Click **Settings** (gear icon, top-right)
3. Click **Profile** tab
4. Click **"Change Photo"** button
5. Select any image file (JPG/PNG)
6. Click **"Save Changes"**
7. **EXPECTED**: ✅ Avatar updates immediately (no broken icon)
8. Refresh page (F5) → ✅ Avatar still there

### ✅ Test 2: Product Thumbnail (3 minutes)
1. Click **"Sell"** button (top navbar)
2. Fill out form:
   - **Title**: "Test Product"
   - **Category**: Select any category
   - **Description**: "This is a test product listing"
3. Click **"Next"**
4. **Price**: "100"
5. **Location**: "Manila, Philippines"
6. Click **"Next"**
7. Upload 1-3 product images
8. Click **"Submit listing"**
9. Go to **Marketplace** tab
10. **EXPECTED**: ✅ Product appears with thumbnail (no broken icon)

### ✅ Test 3: Chat Avatars (1 minute)
1. Click **message icon** (bottom-right, floating button)
2. **EXPECTED**: ✅ All user avatars in chat list are visible
3. Open any conversation
4. **EXPECTED**: ✅ Avatar in chat header is visible
5. Scroll through messages
6. **EXPECTED**: ✅ All message avatars are visible

## 📊 VERIFICATION CHECKLIST

- [ ] Profile photo upload works
- [ ] Profile photo displays after refresh
- [ ] Product thumbnail uploads successfully
- [ ] Product thumbnail visible in marketplace grid
- [ ] Chat avatars load in conversation list
- [ ] Message sender avatars visible in chat
- [ ] No broken image icons anywhere
- [ ] No console errors (F12 → Console tab)

## 🔍 IF SOMETHING DOESN'T WORK

### Check Backend Server:
```bash
# Should show:
Starting development server at http://127.0.0.1:8000/
```

### Check Frontend Server:
```bash
# Should show:
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5174/
```

### Check Console (F12):
- **No 404 errors** on `/media/` requests
- **No CORS errors**
- **No broken image warnings**

### Force Refresh:
- Windows: **Ctrl + F5**
- Mac: **Cmd + Shift + R**

## 🎯 SUCCESS CRITERIA

All of these should be TRUE:

✅ Images upload without errors
✅ Images display immediately after upload
✅ Images persist after page refresh
✅ No broken image icons (🖼️❌)
✅ No console errors
✅ Profile avatars load everywhere (Settings, Navbar, Chat)
✅ Product thumbnails load in marketplace
✅ Chat avatars load in conversations

## 📞 STILL HAVING ISSUES?

1. **Stop both servers** (Ctrl+C in terminals)
2. **Restart backend**:
   ```bash
   cd backend
   python manage.py runserver
   ```
3. **Restart frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
4. **Hard refresh browser**: Ctrl+F5
5. **Clear browser cache** (Ctrl+Shift+Del)

---

**Ready to test?** Follow Test 1, 2, and 3 above! 🚀
