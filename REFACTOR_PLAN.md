# CSS/JS/YAML Refactor Plan

## Current State (Completed in this session)

### ✅ CSS Color System Refactor
- Added CSS custom properties for all colors in `:root`
- Element colors: fire, air, earth, water, poison
- Skill tree colors: all 10 trees (pyrokinetic, aerotheurge, geomancer, hydrosophist, summoning, necromancer, warfare, huntsman, scoundrel, polymorph)
- Skill trees that share element colors use `var(--color-element)` references
- Consolidated selectors work with tags, classes, AND type attributes
- Removed 89 lines of duplicated CSS

### ✅ Typography Variable
- Added `--bold: 600` variable (needs to be added - currently still using hardcoded 600)

### ✅ YAML Ability Type Markup
- Fixed missing type attributes on dual-element summoning abilities
- Changed `.necro` to `.necromancer` for consistency
- All infusion abilities now properly typed:
  - Oil → earth
  - Water → water
  - Blood → necromancer
  - Ice (both abilities) → water
  - Necrofire (both abilities) → fire
  - Cursed Blood → necromancer (both abilities)
- Fixed Cursed Blood Infusion ability names

### ✅ Dev Tooling
- Created Makefile with `make start` (foreground server) and `make kill` (cleanup port)

## Next Phase: Move Styling Logic from JS to CSS

### Current Problems
The JS is doing too much styling work that could be declarative CSS:

1. **Colors being read from CSS then applied via JS**
   - `loadTreeColors()` reads CSS variables
   - JS then applies these colors to DOM elements dynamically
   - **Solution**: Use data attributes + CSS selectors instead

2. **Card Border Colors**
   - Likely set via JS based on skill tree
   - **Solution**: Add `data-tree="pyrokinetic"` to cards, style with CSS

3. **Element Icons**
   - Colors/styling probably set via JS
   - **Solution**: Use CSS with `[data-tree]` or class selectors

4. **Filter Button States**
   - Active/disabled states might be JS-driven
   - **Solution**: CSS classes + `:disabled` pseudo-class

### Proposed Refactor Strategy

#### Phase 1: Audit Current JS Styling
- [ ] Identify all places in `js/app.js` where:
  - Colors are being applied
  - Classes are being toggled for styling (not state)
  - Inline styles are being set
  - DOM manipulation is done for visual purposes

#### Phase 2: Add Data Attributes to HTML
- [ ] Add `data-tree="treename"` to skill cards
- [ ] Add `data-element="element"` where applicable
- [ ] Add `data-type="type"` to abilities/status effects (or use existing type attributes)

#### Phase 3: Create CSS Selectors
Replace JS-driven styling with CSS like:
```css
.skill-card[data-tree="pyrokinetic"] {
  border-left-color: var(--color-pyrokinetic);
}

.element-icon[data-tree="aerotheurge"] {
  background-color: var(--color-aerotheurge);
}
```

#### Phase 4: Simplify JS
- [ ] Remove `loadTreeColors()` and `ALL_TREE_COLORS` mapping
- [ ] Remove direct color manipulation
- [ ] Keep only behavioral JS (filtering, interactions, data loading)

#### Phase 5: Enhance with HTML5 Semantic Elements
Consider using semantic HTML5 elements with custom styling:
- `<article>` for skill cards
- `<data>` for stats/values with value attributes
- `<mark>` for highlighted terms
- Custom elements if needed

### Benefits
- Single source of truth for all styling (CSS)
- Easier to theme/modify colors
- Better separation of concerns
- Potentially smaller JS bundle
- CSS can be cached separately

### TODO for Next Agent
1. Add `--bold` variable to CSS and replace all hardcoded `600`
2. Complete the audit of JS styling logic
3. Plan data attribute schema
4. Implement CSS-based styling
5. Remove redundant JS code

## Files Modified This Session
- `css/styles.css` - Color variables, consolidated selectors
- `js/app.js` - Color loading from CSS
- `data/skills.yaml` - Ability type attributes
- `Makefile` - Dev server commands
- `TODO.md` - Workflow notes
