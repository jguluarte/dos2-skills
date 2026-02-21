/**
 * Consistency tests — lock down known-good values.
 *
 * These exist so that automated changes (AI or otherwise) don't silently
 * drift constants, pairing rules, or text formatting. They check exact
 * values, not counts. If a test here breaks, either the change was
 * intentional (update the test) or something drifted that shouldn't have.
 *
 * All tests here use require() directly — no DOM mocking needed.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  SUMMONING, PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST,
  WARFARE, HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER,
  ELEMENTAL_TREES, NON_ELEMENTAL_TREES, ALL_TREES,
} = require('../js/constants.js');

const {
  getValidSecondaryOptions,
  buildSummaryText,
  highlightSpecialTerms,
  groupSkillsByElement,
} = require('../js/filter-logic.js');

// ── tree constants ───────────────────────────────────────

describe('tree constants', () => {
  it('ELEMENTAL_TREES', () => {
    assert.deepEqual(ELEMENTAL_TREES,
      [PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST]);
  });

  it('NON_ELEMENTAL_TREES', () => {
    assert.deepEqual(NON_ELEMENTAL_TREES,
      [WARFARE, HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER]);
  });

  it('ALL_TREES', () => {
    assert.deepEqual(ALL_TREES, [
      PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST, SUMMONING,
      WARFARE, HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER,
    ]);
  });
});

// ── pairing rules (getValidSecondaryOptions) ─────────────

describe('valid secondary options', () => {
  it('Summoning pairs with elementals + Necromancer', () => {
    assert.deepEqual(getValidSecondaryOptions(SUMMONING),
      [...ELEMENTAL_TREES, NECROMANCER]);
  });

  it('elemental primary pairs with non-elementals', () => {
    for (const tree of ELEMENTAL_TREES) {
      assert.deepEqual(getValidSecondaryOptions(tree), NON_ELEMENTAL_TREES,
        `${tree} should pair with non-elemental trees`);
    }
  });

  it('non-elemental primary pairs with elementals', () => {
    for (const tree of NON_ELEMENTAL_TREES) {
      assert.deepEqual(getValidSecondaryOptions(tree), ELEMENTAL_TREES,
        `${tree} should pair with elemental trees`);
    }
  });

  it('no tree appears in its own secondary options', () => {
    for (const tree of ALL_TREES) {
      assert.ok(!getValidSecondaryOptions(tree).includes(tree),
        `${tree} should not appear in its own secondary options`);
    }
  });
});

// ── skill grouping ───────────────────────────────────────

describe('skill grouping', () => {
  const skills = [
    { name: 'Summon+Pyro',     requirements: { [SUMMONING]: 1, [PYROKINETIC]: 1 } },
    { name: 'Pyro+Necro',      requirements: { [PYROKINETIC]: 1, [NECROMANCER]: 1 } },
    { name: 'Aero+Warfare',    requirements: { [AEROTHEURGE]: 1, [WARFARE]: 1 } },
    { name: 'Geo+Huntsman',    requirements: { [GEOMANCER]: 1, [HUNTSMAN]: 1 } },
    { name: 'Hydro+Scoundrel', requirements: { [HYDROSOPHIST]: 1, [SCOUNDREL]: 1 } },
  ];
  const grouped = groupSkillsByElement(skills);
  const toNames = list => list.map(s => s.name.toLowerCase()).sort();

  it('Summoning group contains all Summoning skills', () => {
    assert.deepEqual(toNames(grouped[SUMMONING]), ['summon+pyro']);
  });

  it('Pyrokinetic group contains non-Summoning pyro skills', () => {
    assert.deepEqual(toNames(grouped[PYROKINETIC]), ['pyro+necro']);
  });

  it('Aerotheurge group', () => {
    assert.deepEqual(toNames(grouped[AEROTHEURGE]), ['aero+warfare']);
  });

  it('Geomancer group', () => {
    assert.deepEqual(toNames(grouped[GEOMANCER]), ['geo+huntsman']);
  });

  it('Hydrosophist group', () => {
    assert.deepEqual(toNames(grouped[HYDROSOPHIST]), ['hydro+scoundrel']);
  });
});

// ── summary text ─────────────────────────────────────────

describe('summary text', () => {
  it('no filters: "Showing all skills"', () => {
    assert.equal(buildSummaryText(null, new Set()), 'Showing all skills');
  });

  it('primary only: "Showing all {tree} skills"', () => {
    assert.equal(buildSummaryText(PYROKINETIC, new Set()),
      `Showing all ${PYROKINETIC} skills`);
  });

  it('primary + secondary: "Showing all {tree} skills, with {tree}"', () => {
    assert.equal(
      buildSummaryText(PYROKINETIC, new Set([WARFARE])),
      `Showing all ${PYROKINETIC} skills, with ${WARFARE}`);
  });

  it('multiple secondary: joins with "or"', () => {
    assert.equal(
      buildSummaryText(null, new Set([WARFARE, NECROMANCER])),
      `Showing skills with ${WARFARE} or ${NECROMANCER}`);
  });
});

// ── highlightSpecialTerms ────────────────────────────────

describe('highlightSpecialTerms', () => {
  it('wraps exact terms in a span', () => {
    assert.equal(
      highlightSpecialTerms('Cast Fireball on target', ['Fireball']),
      'Cast <span class="special-term">Fireball</span> on target'
    );
  });

  it('matches whole words only (not substrings)', () => {
    assert.equal(
      highlightSpecialTerms('Fireballist uses Fireball', ['Fireball']),
      'Fireballist uses <span class="special-term">Fireball</span>'
    );
  });

  it('no terms or null returns original text', () => {
    assert.equal(highlightSpecialTerms('Some text', []), 'Some text');
    assert.equal(highlightSpecialTerms('Some text', null), 'Some text');
  });
});
