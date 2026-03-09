import { describe, it, expect } from 'vitest';
import {
    SUMMONING, PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST, WARFARE,
    HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER, ELEMENTAL_TREES,
    NON_ELEMENTAL_TREES, ALL_TREES,
} from '../js/constants.js';
import {
    getValidSecondaryOptions,
    buildSummaryText,
} from '../js/filter-logic.js';

describe('tree constants', () => {
    it('ELEMENTAL_TREES', () => {
        expect(ELEMENTAL_TREES).toEqual(
            [PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST]
        );
    });

    it('NON_ELEMENTAL_TREES', () => {
        expect(NON_ELEMENTAL_TREES).toEqual(
            [WARFARE, HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER]
        );
    });

    it('ALL_TREES', () => {
        expect(ALL_TREES).toEqual([
            PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST,
            WARFARE, HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER,
            SUMMONING,
        ]);
    });
});

describe('valid secondary options', () => {
    it('Summoning pairs with elementals + Necromancer', () => {
        expect(getValidSecondaryOptions(SUMMONING)).toEqual(
            [...ELEMENTAL_TREES, NECROMANCER]
        );
    });

    for (const tree of ELEMENTAL_TREES) {
        it(`${tree} pairs with non-elementals`, () => {
            expect(getValidSecondaryOptions(tree)).toEqual(
                NON_ELEMENTAL_TREES
            );
        });
    }

    for (const tree of NON_ELEMENTAL_TREES) {
        it(`${tree} pairs with elementals`, () => {
            expect(getValidSecondaryOptions(tree)).toEqual(
                ELEMENTAL_TREES
            );
        });
    }
});

describe('summary text', () => {
    it('no filters: "Showing all skills"', () => {
        expect(buildSummaryText(null, new Set())).toBe(
            'Showing all skills'
        );
    });

    it('primary only', () => {
        expect(buildSummaryText(PYROKINETIC, new Set())).toBe(
            `Showing all ${PYROKINETIC} skills`
        );
    });

    it('primary + secondary', () => {
        expect(
            buildSummaryText(PYROKINETIC, new Set([WARFARE]))
        ).toBe(`Showing all ${PYROKINETIC} skills, with ${WARFARE}`);
    });

    it('primary + two secondaries', () => {
        const expected = (
            `Showing all ${PYROKINETIC} skills, with ${WARFARE} or `
            + NECROMANCER
        );
        expect(
            buildSummaryText(
                PYROKINETIC, new Set([WARFARE, NECROMANCER])
            )
        ).toBe(expected);
    });

    it('single secondary only', () => {
        expect(buildSummaryText(null, new Set([WARFARE]))).toBe(
            `Showing all ${WARFARE} skills`
        );
    });

    it('multiple secondaries joins with "or"', () => {
        expect(
            buildSummaryText(null, new Set([WARFARE, NECROMANCER]))
        ).toBe(`Showing skills with ${WARFARE} or ${NECROMANCER}`);
    });
});
