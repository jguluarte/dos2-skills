# Next Steps: Move Styling from JS to CSS

## Current Problem
JavaScript is doing styling work that should be declarative CSS:

1. **Colors Applied via JS**
   - `loadTreeColors()` reads CSS variables
   - JS applies these to DOM elements dynamically
   - **Goal**: Use `data-tree` attributes + CSS selectors instead

2. **Card Border Colors**
   - Set via JS based on skill tree
   - **Goal**: `.skill-card[data-tree="pyrokinetic"] { border-left-color: var(--color-pyrokinetic); }`

3. **Element Icons**
   - Colors/styling set via JS
   - **Goal**: CSS with `[data-tree]` selectors

## Implementation Plan

### Step 1: Audit JS Styling
Search `js/app.js` for:
- `.style.color =`
- `.style.backgroundColor =`
- `.style.borderColor =`
- Dynamic class toggling for visual purposes only

### Step 2: Add Data Attributes
- Add `data-tree="pyrokinetic"` to skill cards during render
- Add `data-element="fire"` to element headers
- Use these for CSS targeting instead of JS manipulation

### Step 3: CSS Selectors Replace JS
```css
/* Card borders by tree */
.skill-card[data-tree="pyrokinetic"] { border-left-color: var(--color-fire); }
.skill-card[data-tree="aerotheurge"] { border-left-color: var(--color-air); }

/* Element icons */
.element-icon[data-element="fire"] { background-color: var(--color-fire); }
```

### Step 4: Simplify JS
- Remove `loadTreeColors()` and `ALL_TREE_COLORS` mapping
- Remove direct style manipulation
- Keep only behavioral JS (filtering, data loading, interactions)

## Benefits
- Single source of truth for styling (CSS)
- Easier to theme/modify
- Better separation of concerns
- Smaller JS bundle
- Better caching

## Manual Cleanup Needed
**TODO**: Review and manually clean up `data/skills.yaml`
- Check for inconsistent formatting
- Verify all semantic tags are correct
- Look for any missed status/ability conversions
- Ensure line lengths are reasonable
