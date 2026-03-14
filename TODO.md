# Future Development

## Refactoring: JavaScript Architecture

### State management — introduce FilterState

All of these are facets of the same problem: there's no state management layer. The module globals, repeated sync calls, URL param naming, `scrollTo` side effect, and controller-layer duplication are all symptoms of filter state being scattered across the codebase.

**The fix is one cohesive refactor:**

- [ ] **FilterState class** — encapsulates `primary` (SkillTree|null) + `secondaries` (Set<SkillTree>). Owns:
  - URL serialization (`toURL()`, `static fromURL()`) — absorbs `parseFiltersFromURL`, `buildFilterQueryString`, and the `andFilter`/`orFilter` naming issue
  - Summary text generation — absorbs `buildSummaryText`
  - Valid-secondary cleanup on primary change — absorbs `cleanSecondaryFilters`
  - State transitions (toggle primary, toggle secondary, clear) — replaces the scattered toggle functions and their repeated 4-5 post-update call sequences
- [ ] Replace module-level globals (`primaryFilter`, `secondaryFilters`) with a single FilterState instance
- [ ] `applyFilters` becomes pure DOM visibility toggling — `scrollTo` moves to the state transition handler
- [ ] Initialization constructs FilterState from URL, then hands it to the view

### Data modeling — Model layer

- [ ] Consider TypeScript migration for more natural typing & validation
- [ ] **SkillTree** — more than a string constant. Has `name`, `type` (elemental / non-elemental / summoning), `color`. Knows its valid pairings. Replaces the loose `ELEMENTAL_TREES` / `NON_ELEMENTAL_TREES` arrays and the `VALID_SECONDARY_BY_PRIMARY` lookup table
- [ ] **SkillDatabase** — holds the full list of Skills loaded from YAML. Can filter by a FilterState, sort. Replaces the `skillsByCategory` global. Absorbs `any()` from Skill class and `groupSkillsByTree` logic from app.js

### View layer
- [ ] `applyFilters` still reads `data-trees` from the DOM — refactor to work with Skill objects directly, then remove `data-trees` from the template

## Features
- [ ] Import all skills from the wiki (not just cross-class skills)
- [ ] Update the filter pattern to support the full skill set
- [ ] Fix non-mobile rendering

## CSS
- [ ] Clean up coupling between JS rendering (data attributes) and CSS selectors — make the contract explicit
