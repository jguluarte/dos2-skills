# DOS2 Cross-Skills Lookup

Interactive skill lookup tool for Divinity Original Sin 2 cross-class abilities. Helps with build planning by showing all skills that require two different skill trees.

## Features

- **Smart Filtering**: Two-tier filter system (primary + secondary) with auto-validation
- **Mobile-First**: Optimized for phone use during gaming sessions
- **Visual Design**: Color-coded by skill trees, AP/SP cost icons
- **URL Persistence**: Filter state saved in URL for easy sharing/bookmarking

## Project Structure

```
dos2-skills/
├── index.html              # Main HTML file
├── css/
│   ├── styles.scss         # SCSS source
│   └── styles.css          # Compiled CSS
├── js/
│   ├── app.js              # DOM wiring and rendering
│   ├── constants.js         # Tree name constants (ESM)
│   └── filter-logic.js      # Pure filter logic (ESM, testable)
├── data/
│   └── skills.yaml          # All cross-skills (verified against wiki)
├── test/
│   ├── apply-filters.test.js
│   ├── consistency.test.js
│   ├── data-validation.test.js
│   └── filter-state.test.js
├── Makefile
└── README.md
```

## Development

### Prerequisites

Uses [devbox](https://www.jetpack.io/devbox/) + direnv for reproducible tooling (Node.js, Sass, Python, pre-commit).

### Local Testing

```bash
make start    # SCSS watch + dev server on :8000
make test     # Run test suite (Node.js built-in test runner)
```

### Data Structure

`data/skills.yaml` contains a flat array of skill objects:

```yaml
- name: Fire Infusion
  requirements:
    Summoning: 1
    Pyrokinetic: 1
  wiki_url: https://...
  ap_cost: 1
  sp_cost: 0
  range: 13m
  cooldown: 3
  effect: >
    Change Incarnate's element to fire...
```

### Filter Logic

- **Primary Filter** (single-select): Must have this skill tree
- **Secondary Filter** (multi-select): Must have at least one of these
- **Dynamic Options**: Secondary options change based on primary selection:
  - `Summoning` → can pair with elementals + Necromancer
  - Elementals → can pair with non-elementals (War/Hunt/Scoundrel/Poly/Necro)
  - Non-elementals → can pair with elementals
- **Exclusion Rules**:
  - Summoning skills hidden when primary is elemental/necro
  - Non-summoning skills hidden when Summoning is in filters

## Deployment

### GitHub Pages

The project is currently deployed at:
https://jguluarte.github.io/divinity-original-sin-2_cross-class-lookup/

## Data Verification

All 51 skills have been individually verified against the Fextralife wiki:
- 25 unique combinations
- 23 combinations with 2 variants each (base + upgraded)
- 1 combination with 3 variants (Throw Dust → Dust Blast)

## Credits

Built for personal use during DOS2 co-op sessions.
Data sourced from [Fextralife Wiki](https://divinityoriginalsin2.wiki.fextralife.com/).
