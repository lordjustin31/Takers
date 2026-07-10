# Test Comments API

## Quick Test

### 1. Get a Product ID with Comments

```bash
cd backend
python manage.py shell
```

```python
from marketplace.models import Product, Comment
product = Product.objects.filter(comments__isnull=False).first()
print(f"Product ID: {product.id}")
print(f"Product Title: {product.title}")
print(f"Seller: {product.seller.username}")
print(f"Comment count: {Comment.objects.filter(product=product).count()}")
```

### 2. Test API Endpoint

Open browser and go to:
```
http://localhost:8000/api/comments/?product=1
```

Replace `1` with the actual product ID from step 1.

**Expected:** JSON array with comments

**If you see:** `{"detail": "Authentication credentials were not provided."}`
- Comments endpoint requires authentication
- Need to be logged in

### 3. Test with curl (with auth)

First get your token:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

Then test comments:
```bash
curl http://localhost:8000/api/comments/?product=1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Frontend Console Test

1. Open http://localhost:5174
2. Login
3. Go to any product page
4. Open browser console (F12)
5. Type:
```javascript
fetch('http://localhost:8000/api/comments/?product=1', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('access')
  }
})
.then(r => r.json())
.then(d => console.log(d))
```

Replace `1` with actual product ID.

**Expected:** Array of comments

### 5. Check if Comments Are Loading

On ProductDetailPage, check browser console for:
- Network tab → Look for `/api/comments/` request
- Console tab → Look for errors
- Response → Check if it's returning data

### Issue Might Be:

1. **API requires authentication** - Comments endpoint has `IsAuthenticatedOrReadOnly`
2. **Frontend not fetching** - useEffect might not be running
3. **Product ID mismatch** - Wrong product ID in request
4. **CORS issue** - Backend not allowing requests
5. **Empty response** - Product has no comments

Let me know what you see!
