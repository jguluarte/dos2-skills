/**
 * Tests for filter state management: URL persistence and secondary
 * filter cleanup when primary changes.
 *
 * All tests here use require() directly — no DOM mocking needed.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  SUMMONING, PYROKINETIC, AEROTHEURGE, GEOMANCER,
  WARFARE, NECROMANCER, ALL_TREES,
} = require('../js/constants.js');

const {
  parseFiltersFromURL,
  buildFilterQueryString,
  cleanSecondaryFilters,
} = require('../js/filter-logic.js');

// ── URL parsing ──────────────────────────────────────────

describe('URL loading', () => {
  it('loads primary and secondary from URL params', () => {
    const result = parseFiltersFromURL(
      `?and=${PYROKINETIC}&or=${WARFARE},${NECROMANCER}`
    );
    assert.equal(result.primaryFilter, PYROKINETIC);
    assert.deepEqual([...result.secondaryFilters].sort(),
      [NECROMANCER, WARFARE]);
  });

  it('ignores invalid tree names', () => {
    const result = parseFiltersFromURL(
      `?and=InvalidTree&or=FakeTree,${WARFARE}`
    );
    assert.equal(result.primaryFilter, null);
    assert.deepEqual([...result.secondaryFilters], [WARFARE]);
  });

  it('strips invalid secondary combos (e.g. elemental+elemental)', () => {
    const result = parseFiltersFromURL(
      `?and=${PYROKINETIC}&or=${WARFARE},${AEROTHEURGE}`
    );
    assert.equal(result.primaryFilter, PYROKINETIC);
    assert.deepEqual([...result.secondaryFilters], [WARFARE]);
  });
});

// ── URL round-trip ───────────────────────────────────────

describe('URL round-trip', () => {
  it('primary + secondary survives save → parse', () => {
    const qs = buildFilterQueryString(
      PYROKINETIC,
      new Set([WARFARE, NECROMANCER])
    );
    const result = parseFiltersFromURL(qs);
    assert.equal(result.primaryFilter, PYROKINETIC);
    assert.deepEqual([...result.secondaryFilters].sort(),
      [NECROMANCER, WARFARE]);
  });

  it('every tree name survives the round-trip', () => {
    for (const tree of ALL_TREES) {
      const qs = buildFilterQueryString(tree, new Set());
      const result = parseFiltersFromURL(qs);
      assert.equal(result.primaryFilter, tree, `${tree} didn't survive round-trip`);
    }
  });

  it('returns empty string when no filters active', () => {
    assert.equal(buildFilterQueryString(null, new Set()), '');
  });
});

// ── secondary cleanup on primary change ──────────────────

describe('secondary cleanup on primary change', () => {
  it('removes secondary that becomes the new primary', () => {
    const cleaned = cleanSecondaryFilters(WARFARE, new Set([WARFARE]));
    assert.deepEqual([...cleaned], []);
  });

  it('preserves valid secondaries when switching between elementals', () => {
    const cleaned = cleanSecondaryFilters(GEOMANCER, new Set([NECROMANCER]));
    assert.deepEqual([...cleaned], [NECROMANCER]);
  });

  it('drops Warfare when switching to Summoning primary', () => {
    const cleaned = cleanSecondaryFilters(SUMMONING, new Set([WARFARE]));
    assert.deepEqual([...cleaned], []);
  });
});
