# Testing Guide for Blog Redesign

## Quick Start

### Option 1: Install Dependencies (if needed)
```bash
cd "C:\Users\kyungbin.lee\OneDrive - UiPath\Desktop\dev\KB0129.github.io"
bundle install
```

### Option 2: Run Jekyll Server
```bash
cd "C:\Users\kyungbin.lee\OneDrive - UiPath\Desktop\dev\KB0129.github.io"
bundle exec jekyll serve --livereload
```

Then open: http://localhost:4000

### Option 3: Push to GitHub Pages
Simply commit and push the changes - GitHub Pages will build automatically.

## What to Test

### 1. Header
- [x] "Dev Log" text appears without the "KB" icon
- [x] Navigation is clean and simple
- [x] Active page is highlighted
- [x] Sticky header stays at top when scrolling

### 2. Home Page
- [x] Profile image is circular
- [x] "Dev Log" title without "/ field notes" suffix
- [x] Recent posts display correctly
- [x] Cards have subtle shadows and hover effects

### 3. Posts Page (Most Important!)
- [x] Search bar at the top
- [x] Category filter buttons below search
- [x] Type in search to filter posts
- [x] Click category buttons to filter
- [x] Click "All" to reset filters
- [x] "No results" message when search returns empty

### 4. Theme Toggle
- [x] Button in bottom-right corner
- [x] Click to switch between light/dark mode
- [x] Preference is saved (localStorage)
- [x] Dark mode uses Dracula colors

### 5. Individual Post Pages
- [x] Clean typography
- [x] Code blocks with Dracula-style dark background
- [x] Readable text with good spacing
- [x] Images have rounded corners and shadows

## Browser Testing

Test in:
- Chrome/Edge
- Firefox
- Safari (if available)
- Mobile browsers (responsive design)

## Mobile Testing

1. Resize browser window to mobile size (< 768px)
2. Check that:
   - Navigation stacks vertically
   - Search and filters are easy to use
   - Posts display in single column
   - All buttons are touch-friendly

## Color Themes

### Light Mode
- Clean white background
- GitHub-style blue accents
- Easy to read in daylight

### Dark Mode (Dracula)
- Dark purple/gray background (#282a36)
- Cyan accents (#8be9fd)
- Green highlights (#50fa7b)
- Popular among developers

## Troubleshooting

### If Jekyll won't start:
```bash
# Try reinstalling gems
bundle install

# Or use GitHub Pages gem
bundle update github-pages
```

### If styles don't apply:
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser console for errors (F12)
3. Verify `_sass/custom/custom.scss` was saved

### If search doesn't work:
1. Check browser console for JavaScript errors
2. Verify `_pages/posts.md` was saved correctly
3. Clear browser cache

## Quick Preview Without Server

You can also:
1. Push changes to GitHub
2. Wait 1-2 minutes for GitHub Pages to build
3. Visit your site at https://kb0129.github.io

## Before/After Comparison

### Before:
- Teal/orange color scheme
- "KB" icon in header
- No search or filtering
- Decorative gradients
- Notion-inspired design

### After:
- GitHub/Dracula color scheme
- Text-only header
- Search and category filters
- Clean, minimal design
- Developer-focused aesthetic

## Feedback

After testing, note:
- What works well
- What could be improved
- Any bugs or issues
- Mobile experience
- Performance (page load speed)

Enjoy your new blog design!
