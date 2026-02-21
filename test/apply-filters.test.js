/**
 * Tests for the shouldSkillShow() filter matching function.
 *
 * The one interesting rule: Summoning is a walled garden.
 *   - Pick any non-Summoning filter → Summoning skills are excluded
 *   - Pick Summoning → non-Summoning skills are excluded
 * Everything else is standard include/exclude.
 *
 * All tests here use require() directly — no DOM mocking needed.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  SUMMONING, PYROKINETIC, AEROTHEURGE, HYDROSOPHIST,
  NECROMANCER, WARFARE,
} = require('../js/constants.js');
const { shouldSkillShow } = require('../js/filter-logic.js');

// ── helpers ──────────────────────────────────────────────

/** Get visible skill names by running shouldSkillShow on each skill. */
function getVisibleSkills(skills, primary, secondary = []) {
  const secondarySet = new Set(secondary);
  return skills
    .filter(skill => {
      const trees = Object.keys(skill.requirements);
      return shouldSkillShow(trees, primary, secondarySet);
    })
    .map(s => s.name.toLowerCase())
    .sort();
}

// ── no filters ───────────────────────────────────────────

describe('no filters active', () => {
  const skills = [
    { name: 'Pyro+Necro',  requirements: { [PYROKINETIC]: 1, [NECROMANCER]: 1 } },
    { name: 'Summon+Pyro', requirements: { [SUMMONING]: 1, [PYROKINETIC]: 1 } },
  ];
  const allNames = skills.map(s => s.name.toLowerCase()).sort();

  it('shows every skill', () => {
    assert.deepEqual(getVisibleSkills(skills, null), allNames);
  });
});

// ── the summoning wall ───────────────────────────────────

describe('summoning exclusion rule', () => {
  const skills = [
    { name: 'Pyro+Necro',   requirements: { [PYROKINETIC]: 1, [NECROMANCER]: 1 } },
    { name: 'Aero+Necro',   requirements: { [AEROTHEURGE]: 1, [NECROMANCER]: 1 } },
    { name: 'Pyro+Warfare', requirements: { [PYROKINETIC]: 1, [WARFARE]: 1 } },
    { name: 'Summon+Pyro',  requirements: { [SUMMONING]: 1, [PYROKINETIC]: 1 } },
    { name: 'Summon+Necro', requirements: { [SUMMONING]: 1, [NECROMANCER]: 1 } },
  ];
  const summoningNames = ['summon+necro', 'summon+pyro'];

  const nonSummoningFilters = [PYROKINETIC, AEROTHEURGE, NECROMANCER, WARFARE];

  for (const filter of nonSummoningFilters) {
    it(`${filter} primary hides summoning skills (even matching ones)`, () => {
      const visible = getVisibleSkills(skills, filter);
      assert.ok(visible.length > 0, `${filter} should show at least one skill`);

      for (const name of summoningNames) {
        assert.ok(!visible.includes(name), `${name} should be hidden under ${filter}`);
      }
    });
  }

  it('Summoning primary shows only summoning skills', () => {
    assert.deepEqual(getVisibleSkills(skills, SUMMONING), summoningNames);
  });
});

// ── basic filter matching ────────────────────────────────

describe('standard filter matching', () => {
  const skills = [
    { name: 'Pyro+Necro',    requirements: { [PYROKINETIC]: 1, [NECROMANCER]: 1 } },
    { name: 'Pyro+Warfare',  requirements: { [PYROKINETIC]: 1, [WARFARE]: 1 } },
    { name: 'Aero+Necro',    requirements: { [AEROTHEURGE]: 1, [NECROMANCER]: 1 } },
    { name: 'Hydro+Warfare', requirements: { [HYDROSOPHIST]: 1, [WARFARE]: 1 } },
    { name: 'Summon+Pyro',   requirements: { [SUMMONING]: 1, [PYROKINETIC]: 1 } },
  ];

  it('primary filter shows only skills with that tree', () => {
    assert.deepEqual(getVisibleSkills(skills, PYROKINETIC),
      ['pyro+necro', 'pyro+warfare']);
  });

  it('secondary filters use OR logic', () => {
    assert.deepEqual(getVisibleSkills(skills, null, [NECROMANCER, WARFARE]),
      ['aero+necro', 'hydro+warfare', 'pyro+necro', 'pyro+warfare']);
  });

  it('primary + secondary requires both', () => {
    assert.deepEqual(getVisibleSkills(skills, PYROKINETIC, [NECROMANCER]),
      ['pyro+necro']);
  });

  it('impossible combo shows nothing', () => {
    assert.deepEqual(getVisibleSkills(skills, SUMMONING, [WARFARE]), []);
  });
});

// ── toggle round-trip ────────────────────────────────────

describe('toggle round-trip', () => {
  const skills = [
    { name: 'Pyro+Necro',   requirements: { [PYROKINETIC]: 1, [NECROMANCER]: 1 } },
    { name: 'Aero+Warfare', requirements: { [AEROTHEURGE]: 1, [WARFARE]: 1 } },
  ];
  const allNames = skills.map(s => s.name.toLowerCase()).sort();

  it('filtering then clearing restores all skills', () => {
    const filtered = getVisibleSkills(skills, PYROKINETIC);
    assert.ok(filtered.length < allNames.length);

    const restored = getVisibleSkills(skills, null);
    assert.deepEqual(restored, allNames);
  });
});
