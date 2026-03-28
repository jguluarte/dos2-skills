## Skills that scale with Summoning

These skills scale with Summoning but the game doesn't list it
as a requirement. We're treating them as cross-class by adding
`secondary_tree: Summoning`.

### Known examples
- Summon Fire Slug (Pyrokinetic 3)
- Wind-Up Toy (Scoundrel 3)
- Summon Artillery Plant (Geomancer 3)
- Summon Oily Blob (Polymorph 2)
- Raise Bloated Corpse (Necromancer 1)
- Raise Bone Widow (Necromancer 2)

### TODO
- Add `secondary_tree: Summoning` to these skills
- Update Summoning filter rule in constants.js
  to allow Summoning as secondary on non-elemental trees
- Add summoning color to `$tree-colors`
- Add `<summon>` tag for effect text markup
- Add `<physical>` tag + color for physical damage
