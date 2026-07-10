# FloatingChat - Draggable Feature ✅

## Ano Ang Ginawa:

Ginawa kong **draggable** ang FloatingChat window! Pwede mo na syang i-move anywhere sa screen by dragging the header.

## New Features:

### 1. Drag and Drop
- **Grab the header** (yung blue part with "Chats" title)
- **Hold and drag** to move the chat window anywhere
- **Release** to drop it in new position

### 2. Smart Constraints
- Hindi lalabas ng screen boundaries
- Automatic limiting sa viewport
- Won't go off-screen even if you drag fast

### 3. Visual Feedback
- Cursor changes to **grabbing hand** while dragging
- Smooth movement animation
- Header has **grab cursor** when hovering

## How It Works:

### Dragging Logic:
```
1. Mouse down on header → Start dragging
2. Mouse move → Update position
3. Mouse up → Stop dragging
```

### Position Calculation:
- Tracks mouse offset from window corner
- Constrains position to viewport bounds
- Smooth real-time updates

### CSS Cursor States:
- **Default:** `cursor: default`
- **Hover header:** `cursor: grab`
- **Dragging:** `cursor: grabbing`

## Technical Details:

### State Management:
```typescript
position: { x: number, y: number }     // Current window position
isDragging: boolean                     // Is currently being dragged
dragOffset: { x: number, y: number }   // Mouse offset from window corner
```

### Event Handlers:
- `handleMouseDown()` - Start drag on header click
- `handleMouseMove()` - Update position while dragging
- `handleMouseUp()` - Stop dragging

### Viewport Constraints:
```typescript
maxX = window.innerWidth - 380   // Chat width
maxY = window.innerHeight - 600  // Chat height
```

### CSS Changes:
```css
/* Header is now draggable */
.chat-header-drag-area {
  cursor: grab;
}

/* While dragging */
cursor: grabbing;

/* Position uses inline styles for dynamic updates */
style={{ position: 'fixed', left, top }}
```

## Usage:

### Para Gamitin:
1. Open FloatingChat (click chat button)
2. Click and hold sa header (blue part)
3. Drag to desired position
4. Release to drop

### Default Position:
- **Right:** 24px from edge
- **Bottom:** 24px from edge

### After Dragging:
- Uses absolute positioning from top-left
- Remembers position until you close/reopen chat

## Files Modified:

- `frontend/src/components/chat/FloatingChat.tsx`

## What Changed:

### Added State:
```typescript
const [position, setPosition] = useState({ x: 0, y: 0 })
const [isDragging, setIsDragging] = useState(false)
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
```

### Added Event Listeners:
```typescript
useEffect(() => {
  if (isDragging) {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return cleanup
  }
}, [isDragging, dragOffset])
```

### Updated Header:
```tsx
<div className="chat-header-drag-area cursor-grab active:cursor-grabbing">
  {/* Content is pointer-events-none */}
  {/* Buttons are pointer-events-auto */}
</div>
```

## Enhancements Made:

✅ Drag from header only (not entire window)
✅ Buttons still clickable while dragging enabled
✅ Smooth dragging with proper offset calculation
✅ Constrained to viewport (won't go off-screen)
✅ Visual feedback with cursor changes
✅ Clean up event listeners on unmount

## Future Improvements (Optional):

- [ ] Remember position in localStorage
- [ ] Snap to corners/edges
- [ ] Double-click header to reset position
- [ ] Mobile touch support
- [ ] Resize handles in corners

## Testing:

### Test Dragging:
1. Open chat
2. Click and drag header
3. ✅ Should move smoothly
4. ✅ Buttons still work
5. ✅ Stays within screen

### Test Constraints:
1. Try dragging off-screen
2. ✅ Should stop at edges
3. ✅ Can't lose the window

### Test Interaction:
1. Drag while typing
2. ✅ Input still works
3. ✅ No interference

## Status: ✅ COMPLETE!

I-refresh lang (Ctrl + F5) and test mo na! 🎉

**Drag the blue header para i-move ang chat!**
