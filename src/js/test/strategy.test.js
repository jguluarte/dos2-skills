import { describe, it, expect } from 'vitest';
import { makeSkill, set } from './helpers.js';
import {
    PYROKINETIC, NECROMANCER, WARFARE, SUMMONING, TRI_STATE,
} from '@constants';
import {
    PrimaryFilter, AnyFilter, SummoningFilter,
    SingleClassFilter, SourceFilter,
} from '@js/strategy.js';

const { YES, NO, ONLY } = TRI_STATE;

function filter(overrides = {}) {
    return {
        primary: null,
        any: new Set(),
        singleClass: null,
        source: null,
        isActive: () => !!(overrides.primary || overrides.any?.size),
        has: (t) => [overrides.primary, ...(overrides.any ?? [])].includes(t),
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
const summonSingle = makeSkill('Conjure', {
    primary_tree: SUMMONING, ...inv,
});

const source = makeSkill('Source Skill', {
    primary_tree: PYROKINETIC, ...inv, sp_cost: 1,
});
const noSource = makeSkill('No Source', {
    primary_tree: PYROKINETIC, ...inv, sp_cost: 0,
});

// ── PrimaryFilter ──────────────────────────────────────

describe('PrimaryFilter', () => {
    it('does not apply when no primary set', () => {
        const f = new PrimaryFilter(filter());
        const skills = [pyroSingle, warfareSingle];

        expect(f.apply(skills)).toStrictEqual(skills);
    });

    it('filters to skills matching primary tree', () => {
        const f = new PrimaryFilter(filter({
            primary: PYROKINETIC,
        }));

        expect(f.apply([pyroSingle, warfareSingle]))
            .toStrictEqual([pyroSingle]);
    });

    it('includes cross-class skills with matching primary', () => {
        const f = new PrimaryFilter(filter({
            primary: PYROKINETIC,
        }));

        expect(f.apply([pyroSingle, pyroCross]))
            .toStrictEqual([pyroSingle, pyroCross]);
    });
});

// ── AnyFilter ──────────────────────────────────────────

describe('AnyFilter', () => {
    it('does not apply when any set is empty', () => {
        const f = new AnyFilter(filter());
        const skills = [pyroSingle, warfareSingle];

        expect(f.apply(skills)).toStrictEqual(skills);
    });

    it('filters to skills matching any tree', () => {
        const f = new AnyFilter(filter({
            any: set(NECROMANCER),
        }));

        expect(f.apply([pyroSingle, pyroCross]))
            .toStrictEqual([pyroCross]);
    });

    it('includes single-class skills when singleClass is YES', () => {
        const f = new AnyFilter(filter({
            any: set(NECROMANCER),
            singleClass: YES,
        }));

        expect(f.apply([pyroSingle, pyroCross]))
            .toStrictEqual([pyroSingle, pyroCross]);
    });

    it('excludes single-class skills when singleClass is not YES', () => {
        const f = new AnyFilter(filter({
            any: set(NECROMANCER),
            singleClass: null,
        }));

        expect(f.apply([pyroSingle, pyroCross]))
            .toStrictEqual([pyroCross]);
    });
});

// ── SummoningFilter ────────────────────────────────────

describe('SummoningFilter', () => {
    it('does not apply when no filters are active', () => {
        const f = new SummoningFilter(filter());
        const skills = [pyroSingle, summonSingle];

        expect(f.apply(skills)).toStrictEqual(skills);
    });

    it('removes summoning when filters active and not selected', () => {
        const f = new SummoningFilter(filter({
            primary: PYROKINETIC,
        }));

        expect(f.apply([pyroSingle, summonSingle]))
            .toStrictEqual([pyroSingle]);
    });

    it('keeps summoning skills when summoning is selected', () => {
        const f = new SummoningFilter(filter({
            primary: SUMMONING,
        }));

        expect(f.apply([pyroSingle, summonSingle]))
            .toStrictEqual([pyroSingle, summonSingle]);
    });
});

// ── SingleClassFilter ──────────────────────────────────

describe('SingleClassFilter', () => {
    it('does not apply when singleClass is null', () => {
        const f = new SingleClassFilter(filter());
        const skills = [pyroSingle, pyroCross];

        expect(f.apply(skills)).toStrictEqual(skills);
    });

    it('does not apply when singleClass is YES', () => {
        const f = new SingleClassFilter(filter({
            singleClass: YES,
        }));
        const skills = [pyroSingle, pyroCross];

        expect(f.apply(skills)).toStrictEqual(skills);
    });

    it('keeps only dual-class when singleClass is NO', () => {
        const f = new SingleClassFilter(filter({
            singleClass: NO,
        }));

        expect(f.apply([pyroSingle, pyroCross]))
            .toStrictEqual([pyroCross]);
    });

    it('keeps only single-class when singleClass is ONLY', () => {
        const f = new SingleClassFilter(filter({
            singleClass: ONLY,
        }));

        expect(f.apply([pyroSingle, pyroCross]))
            .toStrictEqual([pyroSingle]);
    });
});

// ── SourceFilter ───────────────────────────────────────

describe('SourceFilter', () => {
    it('does not apply when source is null', () => {
        const f = new SourceFilter(filter());
        const skills = [source, noSource];

        expect(f.apply(skills)).toStrictEqual(skills);
    });

    it('does not apply when source is YES', () => {
        const f = new SourceFilter(filter({ source: YES }));
        const skills = [source, noSource];

        expect(f.apply(skills)).toStrictEqual(skills);
    });

    it('keeps only non-source when source is NO', () => {
        const f = new SourceFilter(filter({ source: NO }));

        expect(f.apply([source, noSource]))
            .toStrictEqual([noSource]);
    });

    it('keeps only source when source is ONLY', () => {
        const f = new SourceFilter(filter({ source: ONLY }));

        expect(f.apply([source, noSource]))
            .toStrictEqual([source]);
    });
});
