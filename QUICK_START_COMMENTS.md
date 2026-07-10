# 🚀 Quick Start - Comment System

**Everything is ready! Just start the servers.**

---

## Start Servers

### Terminal 1 - Backend:
```bash
cd backend
python manage.py runserver
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

---

## Test It Out

### 1. Comment on a Post

**Steps:**
1. Open http://localhost:5174
2. Login
3. Go to homepage
4. Click **"Comment"** button on any post
5. Type a comment
6. Press **Enter** or click **Send**
7. ✅ Comment appears instantly!

### 2. Get Notified

**Steps:**
1. Browser 1: Login as User A
2. Browser 2: Login as User B
3. Browser 2: Comment on User A's post
4. Browser 1: Check notification bell (top right)
5. ✅ See "New Comment on Your Product"
6. Click notification
7. ✅ Go to product page

### 3. Share a Post

**Steps:**
1. Click **"Share"** button on any post
2. Choose option:
   - **Copy Link** → Link copied to clipboard
   - **Share to Facebook** → Opens Facebook
3. ✅ Link shared!

### 4. Message a Seller

**Steps:**
1. Click **"Message Seller"** button on any post
2. ✅ Opens messages with seller

---

## All Button Functions

| Button | What It Does |
|--------|-------------|
| ❤️ **Save** | Toggle favorite (heart fills) |
| 💬 **Comment** | Show/hide comments |
| 🔗 **Share** | Copy link or share to Facebook |
| ✉️ **Message Seller** | Open chat with seller |
| 👁️ **View Details** | Go to product page |

---

## API Endpoints

### Create Comment:
```
POST /api/comments/
{
  "product": 1,
  "body": "Great product!"
}
```

### Get Comments:
```
GET /api/comments/?product=1
```

### Delete Comment:
```
DELETE /api/comments/{id}/
```

---

## Features

✅ **Working:**
- Post comments
- View comments
- Get notifications
- Share products
- Message sellers
- Save/favorite
- View details
- Reply to comments (backend ready)

---

## Troubleshooting

**Comments not showing?**
```bash
# Check backend
cd backend
python manage.py shell
from marketplace.models import Comment
Comment.objects.all()

# Check frontend
F12 → Console → Look for errors
```

**Notifications not working?**
```bash
# Check notifications
python manage.py shell
from marketplace.models import Notification
Notification.objects.filter(notification_type='comment')
```

---

## That's It!

Everything is working. Just start the servers and test it out! 🎉

**Next:** Add friends, post products, comment, share, and get notified! ✨
