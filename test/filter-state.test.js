/**
 * Tests for filter state management: URL persistence and secondary
 * filter cleanup when primary changes.
 *
 * All tests here use require() directly — no DOM mocking needed.
 */
const { test, describe, it, assert } = require('./test.js');

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

test('URL loading', () => {
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

test('URL round-trip', () => {
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

            assert.equal(
                result.primaryFilter, tree,
                `${tree} didn't survive round-trip`);
        }
    });

    it('returns empty string when no filters active', () => {
        assert.equal(buildFilterQueryString(null, new Set()), '');
    });
});

// ── secondary cleanup on primary change ──────────────────

test('secondary cleanup on primary change', () => {
    it('removes secondary that becomes the new primary', () => {
        const clean = cleanSecondaryFilters(WARFARE, new Set([WARFARE]));
        assert.deepEqual([...clean], []);
    });

    it('preserves valid secondaries when switching between elementals', () => {
        const clean = cleanSecondaryFilters(GEOMANCER, new Set([NECROMANCER]));
        assert.deepEqual([...clean], [NECROMANCER]);
    });

    it('drops Warfare when switching to Summoning primary', () => {
        const clean = cleanSecondaryFilters(SUMMONING, new Set([WARFARE]));
        assert.deepEqual([...clean], []);
    });
});
