# DOS2 Cross-Skills Lookup

Interactive skill lookup tool for Divinity Original Sin 2 cross-class abilities. Helps with build planning by showing all skills that require two different skill trees.

## Features

- **Smart Filtering**: Two-tier filter system (primary + secondary) with auto-validation
- **Mobile-First**: Optimized for phone use during gaming sessions
- **Visual Design**: Color-coded by skill trees, AP/SP cost icons
- **Auto-Hide Filters**: Filters collapse on scroll (mobile) with 3-second grace period
- **URL Persistence**: Filter state saved in URL for easy sharing/bookmarking

## Project Structure

```
dos2-skills/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styles (unminified)
├── js/
│   └── app.js              # Application logic (unminified, commented)
├── data/
│   └── skills.json         # All 51 cross-skills (verified against wiki)
└── README.md               # This file
```

## Development

### Local Testing

Simply open `index.html` in a browser. No build step required.

```bash
# Serve locally with Python
python3 -m http.server 8000
# Then open http://localhost:8000
```

### Data Structure

`data/skills.json` contains a flat array of skill objects:

```json
[
  {
    "name": "Fire Infusion",
    "requirements": {
      "Summoning": 1,
      "Pyrokinetic": 1
    },
    "wiki_url": "https://...",
    "has_wiki_page": true,
    "ability_details": {
      "ap_cost": 1,
      "sp_cost": 0,
      "range": "13m",
      "cooldown": "3",
      "effect": "Change Incarnate's element to fire...",
      "special_terms": ["Fireball"]
    }
  }
]
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

## Color Scheme

- **Pyrokinetic**: Red (#e74c3c)
- **Aerotheurge**: Blue (#3498db)
- **Geomancer**: Green (#27ae60)
- **Hydrosophist**: Teal (#16a085)
- **Summoning**: Purple (#9b59b6)
- **Necromancer**: Mauve (#a64d79)
- **Warfare**: Dark Red (#c0392b)
- **Huntsman**: Olive (#558b2f)
- **Scoundrel**: Grey (#6c757d)
- **Polymorph**: Orange (#f39c12)

## Deployment

### GitHub Pages

The project is currently deployed at:
https://jguluarte.github.io/divinity-original-sin-2_cross-class-lookup/

To update:

```bash
git add .
git commit -m "Update description"
git push
```

### Standalone Version

A minified single-file version exists for maximum portability:
`dos2-cross-skills-standalone.html` (37KB)

## Data Verification

All 51 skills have been individually verified against the Fextralife wiki:
- 25 unique combinations
- 23 combinations with 2 variants each (base + upgraded)
- 1 combination with 3 variants (Throw Dust → Dust Blast)

## Credits

Built for personal use during DOS2 co-op sessions.
Data sourced from [Fextralife Wiki](https://divinityoriginalsin2.wiki.fextralife.com/).
