# Advanced Features Implementation Plan

## Requested Features:

### 1. Product Owner Actions (Marketplace Listings)
**For Product Owner Only:**
- ✅ Edit button
- ✅ Delete button  
- ✅ Forward/Share button (send to specific user via message)
- ⬜ Share to social media

**Where:** Product detail page, marketplace grid

### 2. Profile Interaction Buttons
**For All Users (except private profiles):**
- ⬜ "Add Friend" button
- ⬜ "Message" button (opens FloatingChat)

**Where:** 
- User profile page
- Search results
- Product seller info

**Rules:**
- Hidden if profile is private (`is_private=True`)
- Hidden if viewing own profile

### 3. Transaction-Based Reviews
**Current Problem:**
- Anyone can rate anyone anytime
- No transaction required
- Easy to abuse/fake

**New System:**
- ✅ Created `Transaction` model
- ✅ Reviews require `transaction_id`
- ⬜ Only buyers who completed purchase can rate
- ⬜ Only sellers who sold can rate
- ⬜ One review per transaction
- ⬜ Rating shows on profile only after transaction

**Benefits:**
- Prevents fake reviews
- Buyers rate sellers after purchase
- Sellers rate buyers after sale
- Total sales = total legitimate reviews possible

---

## Implementation Status:

### ✅ Done (Backend):
1. Created `Transaction` model
   - Tracks buyer, seller, product
   - Status: pending, completed, cancelled
   - Review tracking flags
2. Updated `Review` model
   - Added `transaction` foreign key
   - Changed constraint to per-transaction
3. Migrations applied

### ⬜ To Do (Backend):
1. Create Transaction serializers
2. Create Transaction endpoints
3. Update Review endpoints with transaction validation
4. Add product ownership checks
5. Create product update/delete endpoints

### ⬜ To Do (Frontend):
1. **ProductDetailPage:**
   - Add Edit/Delete buttons (owner only)
   - Add Share button
   - Share modal (forward to user)

2. **UserProfilePage:**
   - Add "Message" button (if not private)
   - Add "Add Friend" button
   - Hide if viewing own profile

3. **GlobalSearchResults:**
   - Add "Message" button per user
   - Hide if user is private

4. **Review System:**
   - Update to require transaction
   - Show "Review" button only for completed transactions
   - Display transaction-based reviews

5. **Product Management:**
   - Create product edit form
   - Add delete confirmation
   - Share/forward modal

---

## Database Models:

### Transaction
```python
class Transaction(TimeStampedModel):
    buyer = ForeignKey(User)
    seller = ForeignKey(User)
    product = ForeignKey(Product)
    final_price = DecimalField
    status = "pending" | "completed" | "cancelled"
    completed_at = DateTimeField
    buyer_reviewed = BooleanField  # Track if buyer left review
    seller_reviewed = BooleanField  # Track if seller left review
```

### Review (Updated)
```python
class Review(TimeStampedModel):
    reviewer = ForeignKey(User)
    target_user = ForeignKey(User)
    transaction = ForeignKey(Transaction)  # NEW - Required
    rating = 1-5
    comment = TextField
    
    # Constraint: One review per transaction
```

---

## API Endpoints Needed:

### Transactions:
```
POST   /api/transactions/              Create transaction
GET    /api/transactions/              List user transactions
GET    /api/transactions/{id}/         Get transaction detail
PATCH  /api/transactions/{id}/complete/  Mark as completed
POST   /api/transactions/{id}/review/   Submit review
```

### Products:
```
PUT    /api/products/{id}/             Update product (owner only)
DELETE /api/products/{id}/             Delete product (owner only)
POST   /api/products/{id}/share/       Share product via message
```

### Reviews:
```
GET    /api/users/{id}/reviews/        Get transaction-based reviews only
POST   /api/transactions/{id}/review/  Create review (requires transaction)
```

---

## Frontend Components Needed:

### 1. Product Owner Actions
```tsx
{isOwner && (
  <div className="owner-actions">
    <button onClick={handleEdit}>Edit</button>
    <button onClick={handleDelete}>Delete</button>
    <button onClick={handleShare}>Share</button>
  </div>
)}
```

### 2. Profile Interaction
```tsx
{!user.is_private && !isOwnProfile && (
  <div className="profile-actions">
    <button onClick={() => openChat(user.id)}>Message</button>
    <button onClick={() => addFriend(user.id)}>Add Friend</button>
  </div>
)}
```

### 3. Transaction Reviews
```tsx
{hasCompletedTransaction && !hasReviewed && (
  <button onClick={openReviewModal}>
    Leave Review for {seller.name}
  </button>
)}
```

---

## Privacy Logic:

### Message Button Visibility:
```typescript
const canMessage = (
  targetUser: User,
  currentUser: User
) => {
  if (!currentUser) return false
  if (targetUser.id === currentUser.id) return false
  if (targetUser.is_private) return false
  return true
}
```

### Add Friend Button:
```typescript
const canAddFriend = (
  targetUser: User,
  currentUser: User
) => {
  if (!currentUser) return false
  if (targetUser.id === currentUser.id) return false
  if (targetUser.is_private) return false
  // Check if already friends
  return !isFriend(targetUser.id)
}
```

---

## Review Eligibility Logic:

### Can Leave Review:
```typescript
const canReview = async (
  transactionId: number
) => {
  const transaction = await getTransaction(transactionId)
  
  // Must be completed
  if (transaction.status !== 'completed') return false
  
  // Must be buyer or seller
  const isParticipant = (
    transaction.buyer.id === currentUser.id ||
    transaction.seller.id === currentUser.id
  )
  
  if (!isParticipant) return false
  
  // Check if already reviewed
  if (currentUser.id === transaction.buyer.id) {
    return !transaction.buyer_reviewed
  } else {
    return !transaction.seller_reviewed
  }
}
```

---

## Next Steps:

Priority order:
1. ✅ Database models (Done)
2. ⬜ Transaction API endpoints
3. ⬜ Product edit/delete endpoints
4. ⬜ Profile buttons (Message + Add Friend)
5. ⬜ Product owner actions
6. ⬜ Review system with transaction validation

This is a BIG update! May take multiple sessions.
Current token usage: High, may need to continue next session.
