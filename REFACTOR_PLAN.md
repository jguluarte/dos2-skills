# DOS2 Skills - Development Status & Next Steps

## ✅ Completed This Session

### Semantic HTML Tag System
- **NEW**: Replaced verbose `<ability type="fire">` with clean semantic tags
  - Ability tags: `<pyro>`, `<aerotheurge>`, `<geo>`, `<hydro>`, `<necro>`
  - Damage type tags: `<fire>`, `<air>`, `<earth>`, `<water>`, `<poison>`
  - Status tags: `<status>` (simple, no type attributes)
- Removed all `special_terms` sections from YAML (redundant with semantic tags)
- Removed all `type` attributes from `<status>` tags
- Fixed ability vs status distinction (Venom Coating, Breathing Bubbles)

### CSS Color System & Layered Styling
- Added CSS custom properties in `:root` for all colors
- Element colors: fire, air, earth, water, poison
- Skill tree colors: all 10 trees with `var()` references for DRY
- **Layered CSS approach** for separation of concerns:
  - Layer 1: Colors (damage types + abilities + skill trees)
  - Layer 2: Underline dotted (statuses + abilities)
  - Layer 3: Bold 600 (abilities only)
  - Layer 4: Italics (statuses only)
- Formatted for 80-char line length readability

### Dark Mode Theme
- Dark background gradient: `#0a0e1a` to `#1a1f35`
- Reduced opacity on UI elements (cards, headers, filter bar)
- Cohesive dark theme throughout

### Mobile Fixes
- Fixed scroll prevention on iOS/mobile using `position: fixed`
- Properly save/restore scroll position when filter opens/closes
- Overlay tap now works to close filters

### Developer Experience
- **Makefile**: `make start` (foreground server), `make kill` (cleanup port)
- Clean worktree management
- Updated colors to match game UI better:
  - Air: `#66d9ff` (electric cyan)
  - Water: `#1e90ff` (dodger blue)
  - Warfare: `#be590d` (distinct from pyro/necro)

## 📋 Next Phase: Move Styling Logic from JS to CSS

### Current State
The JS still does styling work that should be declarative CSS:

1. **Colors Applied via JS**
   - `loadTreeColors()` reads CSS variables
   - JS applies these to DOM elements dynamically
   - **Goal**: Use `data-tree` attributes + CSS selectors

2. **Card Border Colors**
   - Set via JS based on skill tree
   - **Goal**: `.skill-card[data-tree="pyrokinetic"] { border-left-color: var(--color-pyrokinetic); }`

3. **Element Icons**
   - Colors/styling set via JS
   - **Goal**: CSS with `[data-tree]` selectors

4. **Filter Button States**
   - May have JS-driven styling
   - **Goal**: Pure CSS with `:disabled`, `.active` classes

### Strategy for Next Agent

#### Step 1: Audit JS Styling
Search `js/app.js` for:
- `.style.color =`
- `.style.backgroundColor =`
- `.style.borderColor =`
- Dynamic class toggling for visual purposes only

#### Step 2: Add Data Attributes
- Add `data-tree="pyrokinetic"` to skill cards during render
- Add `data-element="fire"` to element headers
- Use these for CSS targeting instead of JS manipulation

#### Step 3: CSS Selectors Replace JS
```css
/* Card borders by tree */
.skill-card[data-tree="pyrokinetic"] { border-left-color: var(--color-fire); }
.skill-card[data-tree="aerotheurge"] { border-left-color: var(--color-air); }

/* Element icons */
.element-icon[data-element="fire"] { background-color: var(--color-fire); }
```

#### Step 4: Simplify JS
- Remove `loadTreeColors()` and `ALL_TREE_COLORS` mapping
- Remove direct style manipulation
- Keep only behavioral JS (filtering, data loading, interactions)

### Benefits
- ✅ Single source of truth for styling (CSS)
- ✅ Easier to theme/modify
- ✅ Better separation of concerns
- ✅ Smaller JS bundle
- ✅ Better caching

## 🐛 Known Issues
None! Mobile scroll fix was the last one.

## 📁 Files Modified
- `css/styles.css` - Color system, layered styling, dark mode, formatting
- `js/app.js` - Mobile scroll fix, color loading (to be simplified next)
- `data/skills.yaml` - Semantic tags, removed special_terms, status cleanup
- `Makefile` - Dev commands
- `TODO.md` - Workflow notes
- `REFACTOR_PLAN.md` - This file

## 🔄 Branch Status
- **Current**: `claude/romantic-bhaskara`
- **Merged from**: `claude/charming-rubin` (dark mode + status tags)
- **Ready for**: Merge to main or continue with JS-to-CSS migration
