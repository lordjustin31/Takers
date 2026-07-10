## Plan

### Task 1: Rework Login Page (Minimal & Clean)
**File:** `frontend/src/pages/auth/AuthPage.tsx`

**Changes:**
- **Remove the two-column grid layout** — eliminate the entire right-side "Feature Showcase" panel (dashboard widgets, chart, toggle, revenue stats)
- **Center a single card** on a full-screen layout with `min-h-screen` + centered flex
- **Add "Takers Marketplace" branding** — app name logo/text at the top of the card with a subtle icon (ShoppingBag from lucide), a tagline like "Buy & Sell in One Place"
- **Keep all existing functionality intact:**
  - Login/Register toggle with smooth transition
  - Username, Email (register), Password inputs with `neu-card-inset` styling
  - Password show/hide toggle
  - Validation errors
  - Submit button with blue gradient
  - "OR" divider + Google OAuth button with SVG logo
  - All `framer-motion` animations (slide in from left, error fade in)
- **Add subtle visual enhancement** — a decorative gradient background element or subtle pattern behind the card to make it feel premium without clutter
- **Fully responsive** — works great on mobile and desktop

### Task 2: Fix HomePage Feed Card Containers
**File:** `frontend/src/pages/HomePage.tsx`

**Changes to each feed card (`<motion.article>`):**
1. **Fix `overflow-visible` → `overflow-hidden`** — currently the card uses `overflow-visible` which causes the inset stats bar (`neu-card-inset mx-4 mb-4`) to break out of the card boundary visually. Switch to `overflow-hidden` so all child elements stay contained within the rounded card borders.
2. **Fix the stats inset bar** — the stats section uses `mx-4 mb-4` to create an inset look, but with `overflow-visible` it appears to float outside. Restructure so the stats are properly contained within the card padding with a consistent border-top separator.
3. **Improve image area consistency** — currently uses `object-contain` + `maxHeight: 500px` which creates wildly different card heights. Switch to `object-cover` with a fixed `aspect-ratio` container so all cards have uniform image area height regardless of image dimensions.
4. **Fix card spacing uniformity** — ensure padding is consistent across all card sections (header, content, image, actions, stats) so every card looks identical in structure regardless of content length.

**What will NOT change:**
- Overall neumorphic design theme
- Card colors, shadows, border radius
- All interactive functionality (favorites, comments, share, message seller)
- Filter bar and sidebar layout
- All animations

### Files Modified
1. `frontend/src/pages/auth/AuthPage.tsx` — Login page rework
2. `frontend/src/pages/HomePage.tsx` — Feed card container fixes