import { describe, it, expect } from 'vitest';
import { makeSkill, set } from './helpers.js';
import {
    PYROKINETIC, NECROMANCER, WARFARE, HUNTSMAN,
    AEROTHEURGE,
} from '@constants';
import {
    Investment, Name, SearchMatch,
    SecondaryTree, SingleClass, DEFAULT_SORT,
} from '@js/sorting.js';

function filter(overrides = {}) {
    return {
        primary: null,
        any: new Set(),
        singleClass: null,
        source: null,
        isActive: () => !!(
            overrides.primary || overrides.any?.size
        ),
        has: (t) => [
            overrides.primary,
            ...(overrides.any ?? []),
        ].includes(t),
        ...overrides,
    };
}

// ── fixtures ───────────────────────────────────────────

const inv = { investment: 1 };

const pyroSingle = makeSkill('Haste', {
    primary_tree: PYROKINETIC, ...inv,
});
const pyroCross = makeSkill('Bleed Fire', {
    primary_tree: PYROKINETIC,
    secondary_tree: NECROMANCER, ...inv,
});
const warfareSingle = makeSkill('Battering Ram', {
    primary_tree: WARFARE, ...inv,
});
const aeroHuntsman = makeSkill('Erratic Wisp', {
    primary_tree: AEROTHEURGE,
    secondary_tree: HUNTSMAN, ...inv,
});

// ── Investment ─────────────────────────────────────────

describe('Investment', () => {
    it('sorts by investment ascending', () => {
        const low = makeSkill('Low', {
            primary_tree: PYROKINETIC, investment: 1,
        });
        const high = makeSkill('High', {
            primary_tree: PYROKINETIC, investment: 3,
        });
        const sorter = new Investment(filter());

        expect(sorter.sort(low, high)).toBeLessThan(0);
        expect(sorter.sort(high, low)).toBeGreaterThan(0);
    });

    it('returns 0 for equal investment', () => {
        const a = makeSkill('A', {
            primary_tree: PYROKINETIC, investment: 2,
        });
        const b = makeSkill('B', {
            primary_tree: PYROKINETIC, investment: 2,
        });
        const sorter = new Investment(filter());

        expect(sorter.sort(a, b)).toBe(0);
    });
});

// ── Name ───────────────────────────────────────────────

describe('Name', () => {
    it('sorts alphabetically', () => {
        const sorter = new Name(filter());

        expect(sorter.sort(pyroSingle, warfareSingle))
            .toBeGreaterThan(0);
        expect(sorter.sort(warfareSingle, pyroSingle))
            .toBeLessThan(0);
    });

    it('returns 0 for equal names', () => {
        const a = makeSkill('Same', {
            primary_tree: PYROKINETIC, ...inv,
        });
        const b = makeSkill('Same', {
            primary_tree: WARFARE, ...inv,
        });
        const sorter = new Name(filter());

        expect(sorter.sort(a, b)).toBe(0);
    });
});

// ── SingleClass ────────────────────────────────────────

describe('SingleClass', () => {
    it('single-class sorts before dual-class', () => {
        const sorter = new SingleClass(filter());

        expect(sorter.sort(pyroSingle, pyroCross))
            .toBeLessThan(0);
    });

    it('returns 0 when both are single-class', () => {
        const sorter = new SingleClass(filter());

        expect(sorter.sort(pyroSingle, warfareSingle))
            .toBe(0);
    });

    it('returns 0 when both are dual-class', () => {
        const sorter = new SingleClass(filter());

        expect(sorter.sort(pyroCross, aeroHuntsman))
            .toBe(0);
    });
});

// ── SearchMatch ────────────────────────────────────────

describe('SearchMatch', () => {
    it('label is "Primary Class"', () => {
        expect(SearchMatch.label).toBe('Primary Class');
    });

    it('treeFor returns primaryTree when no filter', () => {
        const sorter = new SearchMatch(filter());

        expect(sorter.treeFor(pyroCross))
            .toBe(pyroCross.primaryTree);
    });

    it('treeFor returns primaryTree if in search terms', () => {
        const sorter = new SearchMatch(filter({
            primary: PYROKINETIC,
        }));

        expect(sorter.treeFor(pyroCross))
            .toBe(PYROKINETIC);
    });

    it('treeFor finds matching any tree when primary'
        + " doesn't match", () => {
        const sorter = new SearchMatch(filter({
            primary: WARFARE,
            any: set(NECROMANCER),
        }));

        expect(sorter.treeFor(pyroCross))
            .toBe(NECROMANCER);
    });

    it('handles null primary in search terms', () => {
        const sorter = new SearchMatch(filter({
            any: set(NECROMANCER),
        }));

        expect(sorter.treeFor(pyroCross))
            .toBe(NECROMANCER);
    });
});

// ── SecondaryTree ──────────────────────────────────────

describe('SecondaryTree', () => {
    describe('noFilter', () => {
        it('skills with secondaryTree sort before those'
            + ' without', () => {
            const sorter = new SecondaryTree(filter());

            expect(sorter.sort(pyroCross, pyroSingle))
                .toBeLessThan(0);
            expect(sorter.sort(pyroSingle, pyroCross))
                .toBeGreaterThan(0);
        });

        it('sorts alphabetically when both have'
            + ' secondaryTree', () => {
            // Huntsman < Necromancer alphabetically
            const sorter = new SecondaryTree(filter());

            expect(sorter.sort(aeroHuntsman, pyroCross))
                .toBeLessThan(0);
        });

        it('returns 0 when both lack secondaryTree', () => {
            const sorter = new SecondaryTree(filter());

            expect(sorter.sort(pyroSingle, warfareSingle))
                .toBe(0);
        });
    });

    describe('sortOtherTree', () => {
        it('finds non-primary tree', () => {
            const sorter = new SecondaryTree(filter({
                primary: PYROKINETIC,
            }));

            // pyroCross trees: [Necromancer, Pyrokinetic]
            //   other = Necromancer
            // aeroHuntsman trees: [Huntsman, Aerotheurge]
            //   other = Huntsman
            // Huntsman < Necromancer
            expect(sorter.sort(aeroHuntsman, pyroCross))
                .toBeLessThan(0);
        });

        it('falls back to empty when find returns'
            + ' undefined', () => {
            const sorter = new SecondaryTree(filter({
                primary: NECROMANCER,
            }));

            // pyroCross: [Necro, Pyro] -> other = Pyro
            // warfareSingle: [undef, Warfare]
            //   find returns undefined (undef !== Necro)
            //   ?? secondaryTree (undef) ?? '' -> ''
            // Pyrokinetic > '' -> positive
            expect(sorter.sort(pyroCross, warfareSingle))
                .toBeGreaterThan(0);
        });
    });
});

// ── DEFAULT_SORT ───────────────────────────────────────

describe('DEFAULT_SORT', () => {
    it('has 7 entries', () => {
        expect(DEFAULT_SORT).toHaveLength(7);
    });

    it('is in correct order', () => {
        expect(DEFAULT_SORT.map((c) => c.label))
            .toStrictEqual([
                'Primary Class', 'Class Level',
                'Single Class', 'Other Class', 'Name',
                'AP Cost', 'SP Cost',
            ]);
    });
});
