import { describe, it, expect } from 'vitest';
import {
    SUMMONING, PYROKINETIC, AEROTHEURGE, GEOMANCER,
    WARFARE, NECROMANCER, ALL_TREES,
} from '../js/constants.js';
import {
    parseFiltersFromURL,
    buildFilterQueryString,
    cleanSecondaryFilters,
} from '../js/filter-logic.js';

const EMPTY_SET = new Set();

// ── URL parsing ──────────────────────────────────────────

describe('URL parsing', () => {
    it('loads primary and secondary from URL params', () => {
        const { primaryFilter, secondaryFilters } = parseFiltersFromURL(
            `?and=${PYROKINETIC}&or=${WARFARE},${NECROMANCER}`
        );

        expect(primaryFilter).toBe(PYROKINETIC);
        expect([...secondaryFilters].sort()).toEqual(
            [NECROMANCER, WARFARE]
        );
    });

    it('ignores invalid tree names', () => {
        const { primaryFilter, secondaryFilters } = parseFiltersFromURL(
            `?and=InvalidTree&or=FakeTree,${WARFARE}`
        );

        expect(primaryFilter).toBeNull();
        expect([...secondaryFilters]).toEqual([WARFARE]);
    });

    it('strips invalid secondary combos', () => {
        const { primaryFilter, secondaryFilters } = parseFiltersFromURL(
            `?and=${PYROKINETIC}&or=${WARFARE},${AEROTHEURGE}`
        );

        expect(primaryFilter).toBe(PYROKINETIC);
        expect([...secondaryFilters]).toEqual([WARFARE]);
    });
});

// ── URL round-trip ───────────────────────────────────────

describe('URL round-trip', () => {
    it('primary + secondary survives save then parse', () => {
        const qs = buildFilterQueryString(
            PYROKINETIC, new Set([WARFARE, NECROMANCER])
        );
        const { primaryFilter, secondaryFilters } = parseFiltersFromURL(qs);
        expect(primaryFilter).toBe(PYROKINETIC);
        expect([...secondaryFilters].sort()).toEqual(
            [NECROMANCER, WARFARE]
        );
    });

    for (const tree of ALL_TREES) {
        it(`${tree} survives the round-trip`, () => {
            const qs = buildFilterQueryString(tree, EMPTY_SET);
            const { primaryFilter } = parseFiltersFromURL(qs);
            expect(primaryFilter).toBe(tree);
        });
    }

    it('returns empty string when no filters active', () => {
        expect(buildFilterQueryString(null, EMPTY_SET)).toBe('');
    });
});

// ── secondary cleanup on primary change ──────────────────

describe('secondary cleanup on primary change', () => {
    it('removes secondary that becomes the new primary', () => {
        const clean = cleanSecondaryFilters(
            WARFARE, new Set([WARFARE])
        );
        expect([...clean]).toEqual([]);
    });

    it('preserves valid secondaries', () => {
        const clean = cleanSecondaryFilters(
            GEOMANCER, new Set([NECROMANCER])
        );
        expect([...clean]).toEqual([NECROMANCER]);
    });

    it('drops invalid secondaries for Summoning', () => {
        const clean = cleanSecondaryFilters( SUMMONING, new Set([WARFARE]) );
        expect([...clean]).toEqual([]);
    });
});
