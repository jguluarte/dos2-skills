import { describe, it, expect } from 'vitest';
import {
    SUMMONING, PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST, WARFARE,
    HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER, ELEMENTAL_TREES,
    NON_ELEMENTAL_TREES, ALL_TREES, VALID_SKILL_COMBINATION,
} from '@constants';

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

describe('valid skill combinations', () => {
    it('Summoning pairs with elementals + Necromancer', () => {
        expect(VALID_SKILL_COMBINATION[SUMMONING]).toEqual(
            [...ELEMENTAL_TREES, NECROMANCER]
        );
    });

    for (const tree of ELEMENTAL_TREES) {
        it(`${tree} pairs with non-elementals`, () => {
            expect(VALID_SKILL_COMBINATION[tree]).toEqual(
                NON_ELEMENTAL_TREES
            );
        });
    }

    for (const tree of NON_ELEMENTAL_TREES) {
        it(`${tree} pairs with elementals`, () => {
            expect(VALID_SKILL_COMBINATION[tree]).toEqual(
                ELEMENTAL_TREES
            );
        });
    }
});
