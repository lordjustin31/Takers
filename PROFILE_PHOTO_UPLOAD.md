# 📸 Profile Photo Upload - Facebook Style

## ✅ What Was Fixed:

### 🎯 **Frontend Features (Settings Page)**

#### **1. Facebook-Style Photo Upload**
- **Hover to Upload**: Hover over avatar → Camera icon appears
- **Click to Upload**: Click avatar or "Change Photo" button
- **Live Preview**: See photo immediately before saving
- **File Validation**: 
  - Max 2MB file size
  - Only image files accepted
  - Shows selected file name
  
#### **2. Upload UI**
```
[Avatar Image]  [Change Photo Button]
     ↓ hover         ↓ click
[Camera Icon]   [File Browser Opens]
     ↓ select
[Preview Updates]
     ↓ save
[Upload to Server]
```

### 🔧 **Backend Updates**

#### **1. User Model**
Added new field:
```python
avatar = models.ImageField(upload_to="avatars/%Y/%m/%d", blank=True, null=True)
```

Method added:
```python
def get_avatar_url(self):
    """Return avatar URL, prioritizing uploaded avatar over URL"""
    if self.avatar:
        return self.avatar.url
    return self.avatar_url
```

#### **2. Serializers Updated**
- `UserPublicSerializer`: Returns avatar via `get_avatar_url()`
- `UserMeSerializer`: Returns avatar via `get_avatar_url()`
- `UserAdminSerializer`: Accepts avatar uploads + returns URL

#### **3. Views Updated**
- `UserViewSet`: Added permission checks
- Users can update own profile
- Admins can update any profile
- Accepts `multipart/form-data` for file uploads

### 📁 **File Structure**

**Uploaded avatars saved to:**
```
backend/media/avatars/2026/06/20/filename.jpg
```

**URL format:**
```
http://localhost:8000/media/avatars/2026/06/20/filename.jpg
```

### 🚀 **How to Use**

#### **From Frontend:**

1. **Go to Settings** → Profile tab
2. **Hover over avatar** → Camera icon appears
3. **Click avatar or "Change Photo"** button
4. **Select image** from your computer
5. **See preview** immediately
6. **Click "Save Changes"** to upload
7. **Avatar updates** everywhere!

#### **From API:**

**Upload avatar:**
```bash
PATCH /api/admin/users/{id}/
Content-Type: multipart/form-data

{
  "display_name": "New Name",
  "avatar": [image file]
}
```

**Response:**
```json
{
  "id": 1,
  "username": "user123",
  "display_name": "New Name",
  "avatar_url": "http://localhost:8000/media/avatars/2026/06/20/photo.jpg",
  "is_staff": false
}
```

### ✨ **Features**

✅ **Live Preview**: See photo before saving  
✅ **Validation**: Size & type checking  
✅ **Error Messages**: Clear feedback  
✅ **Hover Overlay**: Facebook-style hover effect  
✅ **Multiple Upload Methods**: Click avatar or button  
✅ **File Info**: Shows selected file name  
✅ **Success Toast**: Confirmation message  
✅ **Auto Update**: Avatar updates everywhere instantly  

### 🎨 **UI Features**

**Avatar Display:**
- Circular with neumorphic shadow
- 96px × 96px size
- Hover overlay with camera icon
- Black semi-transparent overlay on hover
- Smooth transition animations

**Upload Button:**
- "Change Photo" with camera icon
- Neumorphic style
- Shows file name when selected
- Clickable label

**Preview:**
- Updates immediately on file select
- Shows before uploading to server
- Can change mind before saving

### 🔐 **Security**

**File Validation:**
- Max 2MB file size (frontend check)
- Image files only (frontend check)
- Django file upload validation (backend)
- Secure file storage with timestamped paths

**Permissions:**
- Users can only edit own profile
- Admins can edit any profile
- Authentication required
- Proper error messages

### 📂 **Database Migration**

**Migration created:**
```
marketplace/migrations/0002_user_avatar.py
```

**Applied changes:**
```sql
ALTER TABLE marketplace_user 
ADD COLUMN avatar VARCHAR(100) NULL;
```

### 🎯 **Priority System**

Avatar URL resolution:
```
1. Check if `avatar` field has uploaded file → Use file URL
2. If no uploaded file → Use `avatar_url` (Google OAuth)
3. If neither → Use initials fallback
```

### 🔄 **Workflow**

**First Time Setup:**
1. ✅ Run migration: `python manage.py migrate`
2. ✅ Restart Django server
3. ✅ Upload photo from frontend
4. ✅ Photo saved to `/media/avatars/`
5. ✅ Avatar updates everywhere

**Subsequent Uploads:**
1. Change photo in settings
2. Save changes
3. Old photo remains (not deleted)
4. New photo URL updates

### 📸 **Example Usage**

**Before:**
```
[Avatar with initials: JD]
```

**After Upload:**
```
[Avatar with actual photo] ← Uploaded image
```

**Everywhere Updated:**
- Navbar avatar ✓
- Settings page ✓
- Feed posts ✓
- Chat messages ✓
- Product listings ✓
- Comments ✓
- Reviews ✓

### 🐛 **Troubleshooting**

**"Column does not exist" error:**
```bash
# Run migration
cd backend
python manage.py migrate
```

**Photo not uploading:**
- Check file size (< 2MB)
- Check file type (image/*)
- Check Django server is running
- Check network tab for errors

**Photo not showing:**
- Check MEDIA_URL in settings
- Check MEDIA_ROOT configured
- Check file actually uploaded
- Clear browser cache

### 🎉 **Done!**

Profile photo upload is now working Facebook-style:
- ✅ Hover to see camera icon
- ✅ Click to upload
- ✅ Live preview
- ✅ Save to server
- ✅ Updates everywhere

**Migration completed!** Just restart Django server and refresh browser! 🚀
