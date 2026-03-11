# Future Development

## Refactoring: JavaScript Architecture

### State management (app.js)
- [ ] Replace module-level globals (`skillsByTree`, `primaryFilter`, `secondaryFilters`) with a single state object — makes data flow explicit and opens the door to passing state rather than mutating shared variables
- [ ] Centralize state syncing — `togglePrimaryFilter`, `toggleSecondaryFilter`, and `clearFilters` each repeat the same 4-5 post-update calls; extract a single `syncUI()` or similar
- [ ] Fragile initialization order — calls must happen in a specific sequence with no indication why; document or restructure

### Naming clarity
- [ ] `category` parameter (app.js `renderSkills`) — easily confused with filter "primary/secondary" terminology; consider `displayTree` or `sectionTree`
- [ ] `andFilter`/`orFilter` (filter-logic.js) — URL param names leak into code; rename to `primaryParam`/`secondaryParam` to match app terminology

### Code structure
- [ ] `buildSummaryText` (filter-logic.js) — extract `joinWithOr(items)` helper for the repeated join-with-last-comma pattern
- [ ] `applyFilters` (app.js) — hidden `window.scrollTo` side effect; move to caller or rename to reflect it

### Data modeling (MVC — Model layer)

- [ ] Consider TypeScript migration for more natural typing & validation
- [ ] `any(trees)` — refactor out to SkillCatalog when that object is built; filter-matching logic belongs on the collection, not individual skills
- [ ] **SkillTree** — more than a string constant. Has `name`, `type` (elemental / non-elemental / summoning), `color`. Knows its valid pairings. Replaces the loose `ELEMENTAL_TREES` / `NON_ELEMENTAL_TREES` arrays and the `VALID_SECONDARY_BY_PRIMARY` lookup table
- [ ] **FilterState** — encapsulates `primary` (SkillTree|null) + `secondaries` (Set<SkillTree>). Owns URL serialization (`toURL()`, `static fromURL()`), summary text generation, and valid-secondary cleanup on primary change. Replaces the module globals and scattered helper functions
- [ ] **SkillCatalog** — holds the full list of Skills loaded from YAML. Can filter by a FilterState, sort. Replaces the `skillsByCategory` global. Absorbs `any()` from Skill class. Will also absorb `groupSkillsByTree` logic from app.js

### View layer
- [ ] `applyFilters` still reads `data-trees` from the DOM — refactor to work with Skill objects directly, then remove `data-trees` from the template

### Controller layer
- [ ] Centralize state transitions — filter toggles, URL sync, UI updates should flow through a single path, not repeated 4-5 call sequences
- [ ] Initialization should construct Model objects from YAML, then hand them to the View (grouping/bucketing is still inline)

## Features
- [ ] Import all skills from the wiki (not just cross-class skills)
- [ ] Update the filter pattern to support the full skill set
- [ ] Fix non-mobile rendering

## CSS
- [ ] Clean up coupling between JS rendering (data attributes) and CSS selectors — make the contract explicit
- [ ] Add more space between SP/AP icons
