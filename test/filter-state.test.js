const { test, it, assert } = require('./test.js');

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

test('URL parsing', () => {
    it('loads primary and secondary from URL params', () => {
        const { primaryFilter, secondaryFilters } = parseFiltersFromURL(
            `?and=${PYROKINETIC}&or=${WARFARE},${NECROMANCER}`
        );

        assert.equal(primaryFilter, PYROKINETIC);
        assert.deepEqual(
            [...secondaryFilters].sort(),
            [NECROMANCER, WARFARE]
        );
    });

    it('ignores invalid tree names', () => {
        const { primaryFilter, secondaryFilters } = parseFiltersFromURL(
            `?and=InvalidTree&or=FakeTree,${WARFARE}`
        );

        assert.equal(primaryFilter, null);
        assert.deepEqual([...secondaryFilters], [WARFARE]);
    });

    it('strips invalid secondary combos', () => {
        const { primaryFilter, secondaryFilters } = parseFiltersFromURL(
            `?and=${PYROKINETIC}&or=${WARFARE},${AEROTHEURGE}`
        );

        assert.equal(primaryFilter, PYROKINETIC);
        assert.deepEqual([...secondaryFilters], [WARFARE]);
    });
});

// ── URL round-trip ───────────────────────────────────────

test('URL round-trip', () => {
    it('primary + secondary survives save then parse', () => {
        const qs = buildFilterQueryString(
            PYROKINETIC, new Set([WARFARE, NECROMANCER])
        );
        const { primaryFilter, secondaryFilters } = parseFiltersFromURL(qs);
        assert.equal(primaryFilter, PYROKINETIC);
        assert.deepEqual(
            [...secondaryFilters].sort(),
            [NECROMANCER, WARFARE]
        );
    });

    for (const tree of ALL_TREES) {
        it(`${tree} survives the round-trip`, () => {
            const qs = buildFilterQueryString(tree, new Set());
            const { primaryFilter } = parseFiltersFromURL(qs);

            assert.equal(primaryFilter, tree);
        });
    }

    it('returns empty string when no filters active', () => {
        assert.equal(
            buildFilterQueryString(null, new Set()), '');
    });
});

// ── secondary cleanup on primary change ──────────────────

test('secondary cleanup on primary change', () => {
    it('removes secondary that becomes the new primary', () => {
        const clean = cleanSecondaryFilters( WARFARE, new Set([WARFARE]) );
        assert.deepEqual([...clean], []);
    });

    it('preserves valid secondaries', () => {
        const clean = cleanSecondaryFilters(
            GEOMANCER, new Set([NECROMANCER])
        );
        assert.deepEqual( [...clean], [NECROMANCER] );
    });

    it('drops invalid secondaries for Summoning', () => {
        const clean = cleanSecondaryFilters( SUMMONING, new Set([WARFARE]) );
        assert.deepEqual( [...clean], [] );
    });
});
