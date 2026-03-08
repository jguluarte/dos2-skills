# Future Development

## Environment Setup
- [x] Set up devbox + direnv for reproducible development environment
- [x] Add linting tools (eslint, stylelint, yamllint)
- [x] Configure pre-commit hooks
- [x] Move lint configs to `.config/` directory (eslint, stylelint, yamllint)
- [x] Inline `build.sh` into Makefile as proper Make targets with dependency tracking
- [x] Extract `src/index.html` as template with `__CSS_HASH__` placeholder
- [x] Update pre-commit hook to run `make build` on css/scss/html changes
- [x] Add GitHub Actions CI workflow (lint + test on PRs)

## Refactoring: JavaScript Architecture

### State management (app.js)
- [ ] Replace module-level globals (`skillsByTree`, `primaryFilter`, `secondaryFilters`) with a single state object — makes data flow explicit and opens the door to passing state rather than mutating shared variables
- [ ] Centralize state syncing — `togglePrimaryFilter`, `toggleSecondaryFilter`, and `clearFilters` each repeat the same 4-5 post-update calls; extract a single `syncUI()` or similar
- [ ] Fragile initialization order (lines 362-370) — calls must happen in a specific sequence with no indication why; document or restructure

### Naming clarity
- [x] `skillsData` (app.js) — renamed to `skillsByCategory`
- [ ] `category` parameter (app.js `renderSkills`, `createSkillCard`) — easily confused with filter "primary/secondary" terminology; consider `displayTree` or `sectionTree`
- [ ] `andFilter`/`orFilter` (filter-logic.js:95,100) — URL param names leak into code; rename to `primaryParam`/`secondaryParam` to match app terminology

### Code structure
- [ ] `createSkillCard()` (~100 lines of string concatenation) — extract into a SkillCardView or similar; this is the most natural next refactor after the Skill class
- [ ] `reqBadges` sort (app.js:219-223) — non-obvious `return 1/-1/0` to push category tree last; clarify or extract
- [ ] `buildSummaryText` (filter-logic.js:146-148, 154-156) — duplicated join-with-"or" pattern; extract helper
- [ ] `applyFilters` (app.js:289) — hidden `window.scrollTo` side effect; move to caller or rename to reflect it

### Data modeling (MVC — Model layer)

What exists today: raw YAML dicts passed around as plain objects, string constants for tree names, module-level globals for filter state. No domain objects at all.

**Model objects needed:**

- [x] **Skill** — wraps a raw YAML entry. Knows its `name`, `trees`, `requirements`, `apCost`, `spCost`, `range`, `cooldown`, `effect`, `wikiUrl`. Owns `has(tree)`, `isSummoning`, `primaryTree`, `secondaryTree`. Validates on construction.
  - [x] Validation error types — `MissingNameError`, `MissingRequirementsError`, `MissingEffectError`, `UnknownTreeError`, `PrerequisiteError` in `js/errors.js`; tests check error type
  - [ ] Add `primary_tree` to YAML data, read directly instead of computing (removes `#classifyTrees()`)
  - [ ] Rename `wiki_url` to `url` in YAML data (Skill class already reads it as `url`)
  - [ ] Consider TypeScript migration for more natural typing & validation
  - [ ] `any(trees)` — refactor out to SkillCatalog when that object is built; filter-matching logic belongs on the collection, not individual skills
- [ ] **SkillTree** — more than a string constant. Has `name`, `type` (elemental / non-elemental / summoning), `color`. Knows its valid pairings. Replaces the loose `ELEMENTAL_TREES` / `NON_ELEMENTAL_TREES` arrays and the `VALID_SECONDARY_BY_PRIMARY` lookup table
- [ ] **FilterState** — encapsulates `primary` (SkillTree|null) + `secondaries` (Set<SkillTree>). Owns URL serialization (`toURL()`, `static fromURL()`), summary text generation, and valid-secondary cleanup on primary change. Replaces the module globals and scattered helper functions
- [ ] **SkillCatalog** — holds the full list of Skills loaded from YAML. Can filter by a FilterState, sort. Replaces the `skillsByCategory` global. Absorbs `any()` from Skill class (see FIXME). Will also absorb `groupSkillsByTree` logic from app.js

**View layer:**

- [ ] Extract `createSkillCard()` into a dedicated view module — takes a Skill object and display context, returns DOM. This is tightly coupled to Skill and is the natural next PR after the Skill class refactor
- [ ] Extract pure rendering functions (data in, DOM elements out)
- [x] `createSkillCard()` should take a Skill object, not a raw dict
- [ ] Rendering should read from Model objects, never from raw YAML data

**Controller layer:**

- [ ] Centralize state transitions — filter toggles, URL sync, UI updates should flow through a single path, not repeated 4-5 call sequences
- [ ] Initialization should construct Model objects from YAML, then hand them to the View

## Testing
- [x] Add test runner and basic test infrastructure (Node.js built-in, zero deps)
- [x] Add unit tests for filter logic
- [x] Add data validation tests for skills.yaml
- [ ] Consider E2E tests for critical user flows

## Features
- [ ] Import all skills from the wiki (not just cross-class skills)
- [ ] Update the filter pattern to support the full skill set
- [ ] Fix non-mobile rendering

## CSS / Visual Verification
- [x] Fix iOS background gradient (fallback color for `background-attachment: fixed`)
- [x] Lighten `$bg-primary` for better contrast with header bar
- [ ] Add CSS color verification tests (ensure tree colors don't drift during refactoring)
- [ ] Clean up coupling between JS rendering (data attributes) and CSS selectors — make the contract explicit
- [ ] Consider screenshot/snapshot tests for visual regression (e.g. Playwright or similar)
- [ ] Add more space between SP/AP icons
