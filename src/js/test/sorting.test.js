import { describe, it, expect } from 'vitest';
import { makeSkill, set } from './helpers.js';
import {
    PYROKINETIC, NECROMANCER, WARFARE, HUNTSMAN,
    AEROTHEURGE,
} from '@constants';
import {
    Investment, Name, SearchMatch, APCost, SPCost,
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

const pyroSingle = makeSkill('Haste', {
    primary_tree: PYROKINETIC,
});
const pyroCross = makeSkill('Bleed Fire', {
    primary_tree: PYROKINETIC,
    secondary_tree: NECROMANCER,
});
const warfareSingle = makeSkill('Battering Ram', {
    primary_tree: WARFARE,
});
const aeroHuntsman = makeSkill('Erratic Wisp', {
    primary_tree: AEROTHEURGE,
    secondary_tree: HUNTSMAN,
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
            primary_tree: PYROKINETIC,
        });
        const b = makeSkill('Same', {
            primary_tree: WARFARE,
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

    it('sorts by primary tree when no filter', () => {
        const sorter = new SearchMatch(filter());

        // Pyrokinetic > Aerotheurge alphabetically
        expect(sorter.sort(pyroSingle, aeroHuntsman))
            .toBeGreaterThan(0);
        expect(sorter.sort(aeroHuntsman, pyroSingle))
            .toBeLessThan(0);
    });

    it('sorts by matching search term when filter'
        + ' active', () => {
        const sorter = new SearchMatch(filter({
            primary: WARFARE,
            any: set(NECROMANCER),
        }));

        // pyroCross matches Necromancer
        // warfareSingle matches Warfare
        // Necromancer < Warfare alphabetically
        expect(sorter.sort(pyroCross, warfareSingle))
            .toBeLessThan(0);
    });
});

// ── APCost ────────────────────────────────────────────

describe('APCost', () => {
    it('sorts by AP cost ascending', () => {
        const low = makeSkill('Cheap', {
            primary_tree: PYROKINETIC,
            investment: 1, ap_cost: 1,
        });
        const high = makeSkill('Expensive', {
            primary_tree: PYROKINETIC,
            investment: 1, ap_cost: 3,
        });
        const sorter = new APCost(filter());

        expect(sorter.sort(low, high)).toBeLessThan(0);
        expect(sorter.sort(high, low)).toBeGreaterThan(0);
    });

    it('returns 0 for equal AP cost', () => {
        const a = makeSkill('A', {
            primary_tree: PYROKINETIC,
            investment: 1, ap_cost: 2,
        });
        const b = makeSkill('B', {
            primary_tree: PYROKINETIC,
            investment: 1, ap_cost: 2,
        });
        const sorter = new APCost(filter());

        expect(sorter.sort(a, b)).toBe(0);
    });
});

// ── SPCost ────────────────────────────────────────────

describe('SPCost', () => {
    it('sorts by SP cost ascending', () => {
        const low = makeSkill('Cheap', {
            primary_tree: PYROKINETIC,
            investment: 1, sp_cost: 0,
        });
        const high = makeSkill('Expensive', {
            primary_tree: PYROKINETIC,
            investment: 1, sp_cost: 3,
        });
        const sorter = new SPCost(filter());

        expect(sorter.sort(low, high)).toBeLessThan(0);
        expect(sorter.sort(high, low)).toBeGreaterThan(0);
    });

    it('returns 0 for equal SP cost', () => {
        const a = makeSkill('A', {
            primary_tree: PYROKINETIC,
            investment: 1, sp_cost: 1,
        });
        const b = makeSkill('B', {
            primary_tree: PYROKINETIC,
            investment: 1, sp_cost: 1,
        });
        const sorter = new SPCost(filter());

        expect(sorter.sort(a, b)).toBe(0);
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

// ── Sort chain (map/find pattern from Main.svelte) ────

describe('sort chain integration', () => {
    function chainSort(skills, sorting) {
        return [...skills].sort((a, b) =>
            sorting.map((fn) => fn(a, b))
                .find((r) => !!r) ?? 0
        );
    }

    it('chains multiple sort functions', () => {
        const a = makeSkill('Alpha', {
            primary_tree: PYROKINETIC, investment: 2,
        });
        const b = makeSkill('Beta', {
            primary_tree: PYROKINETIC, investment: 1,
        });
        const c = makeSkill('Charlie', {
            primary_tree: AEROTHEURGE, investment: 1,
        });

        const f = filter();
        const sorting = [
            new SearchMatch(f).sort,
            new Investment(f).sort,
            new Name(f).sort,
        ];

        const result = chainSort([a, b, c], sorting);

        // Aerotheurge < Pyrokinetic, so c first
        // then investment: b(1) < a(2)
        expect(result.map((s) => s.name))
            .toStrictEqual(['Charlie', 'Beta', 'Alpha']);
    });

    it('falls back to later sort when earlier returns'
        + ' 0', () => {
        const a = makeSkill('Zeta', {
            primary_tree: PYROKINETIC, investment: 1,
        });
        const b = makeSkill('Alpha', {
            primary_tree: PYROKINETIC, investment: 1,
        });

        const f = filter();
        const sorting = [
            new SearchMatch(f).sort,
            new Investment(f).sort,
            new Name(f).sort,
        ];

        const result = chainSort([a, b], sorting);

        // Same tree, same investment -> falls to Name
        expect(result.map((s) => s.name))
            .toStrictEqual(['Alpha', 'Zeta']);
    });

    it('returns 0 when all sort functions return 0', () => {
        const a = makeSkill('Same', {
            primary_tree: PYROKINETIC, investment: 1,
            ap_cost: 2, sp_cost: 0,
        });
        const b = makeSkill('Same', {
            primary_tree: PYROKINETIC, investment: 1,
            ap_cost: 2, sp_cost: 0,
        });

        const f = filter();
        const sorting = DEFAULT_SORT.map(
            (Cls) => new Cls(f).sort
        );

        const result = sorting.map(
            (fn) => fn(a, b)
        ).find((r) => !!r) ?? 0;

        expect(result).toBe(0);
    });

    it('preserves original order with empty sorting'
        + ' array', () => {
        const a = makeSkill('Zeta', {
            primary_tree: PYROKINETIC, investment: 3,
        });
        const b = makeSkill('Alpha', {
            primary_tree: AEROTHEURGE, investment: 1,
        });

        const result = chainSort([a, b], []);

        // No sort functions -> find returns undefined
        // ?? 0 -> stable, original order preserved
        expect(result.map((s) => s.name))
            .toStrictEqual(['Zeta', 'Alpha']);
    });

    it('sorts a realistic set of skills with default'
        + ' sort order', () => {
        const pyro1 = makeSkill('Fireball', {
            primary_tree: PYROKINETIC, investment: 2,
            ap_cost: 2, sp_cost: 0,
        });
        const pyro2 = makeSkill('Haste', {
            primary_tree: PYROKINETIC, investment: 1,
            ap_cost: 1, sp_cost: 0,
        });
        const pyroNecro = makeSkill('Bleed Fire', {
            primary_tree: PYROKINETIC,
            secondary_tree: NECROMANCER,
            investment: 2, ap_cost: 2, sp_cost: 0,
        });
        const aeroHunt = makeSkill('Erratic Wisp', {
            primary_tree: AEROTHEURGE,
            secondary_tree: HUNTSMAN,
            investment: 1, ap_cost: 1, sp_cost: 0,
        });

        const f = filter();
        const sorting = DEFAULT_SORT.map(
            (Cls) => new Cls(f).sort
        );

        const result = chainSort(
            [pyro1, pyroNecro, aeroHunt, pyro2],
            sorting
        );

        // SearchMatch (primary tree):
        //   Aerotheurge < Pyrokinetic
        // Among Pyro skills, Investment:
        //   pyro2(1) < pyro1(2), pyroNecro(2)
        // SingleClass: pyro1(single, 0) < pyroNecro(dual, 1)
        expect(result.map((s) => s.name))
            .toStrictEqual([
                'Erratic Wisp', 'Haste',
                'Fireball', 'Bleed Fire',
            ]);
    });

    it('sort chain respects active filter context', () => {
        const pyroNecro = makeSkill('Bleed Fire', {
            primary_tree: PYROKINETIC,
            secondary_tree: NECROMANCER,
            investment: 1, ap_cost: 2, sp_cost: 0,
        });
        const aeroNecro = makeSkill('Grasp of the Starved', {
            primary_tree: AEROTHEURGE,
            secondary_tree: NECROMANCER,
            investment: 1, ap_cost: 1, sp_cost: 0,
        });

        const f = filter({
            primary: NECROMANCER,
            any: set(PYROKINETIC),
        });
        const sorting = [
            new SearchMatch(f).sort,
            new SecondaryTree(f).sort,
            new Name(f).sort,
        ];

        const result = chainSort(
            [pyroNecro, aeroNecro], sorting
        );

        // SearchMatch: both match Necromancer -> 0
        // SecondaryTree (sortOtherTree):
        //   pyroNecro other = Pyrokinetic
        //   aeroNecro other = Aerotheurge
        //   Aerotheurge < Pyrokinetic
        expect(result.map((s) => s.name))
            .toStrictEqual([
                'Grasp of the Starved', 'Bleed Fire',
            ]);
    });
});
