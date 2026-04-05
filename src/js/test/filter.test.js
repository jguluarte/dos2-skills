import { describe, it, expect } from 'vitest';
import { makeSkill, set } from './helpers.js';
import {
    SUMMONING, PYROKINETIC, AEROTHEURGE, NECROMANCER, WARFARE,
} from '@constants';
import { defaultSort, summarize } from '@js/filter.js';

// ── sorting ─────────────────────────────────────────────

describe('sorting', () => {
    const inv = { investment: 1 };
    const pyroSingle = makeSkill('Haste', {
        primary_tree: PYROKINETIC, ...inv,
    });
    const aeroSingle = makeSkill('Blinding', {
        primary_tree: AEROTHEURGE, ...inv,
    });
    const pyroCross = makeSkill('Bleed Fire', {
        primary_tree: PYROKINETIC,
        secondary_tree: NECROMANCER, ...inv,
    });
    const aeroCross = makeSkill('Vacuum Touch', {
        primary_tree: AEROTHEURGE,
        secondary_tree: NECROMANCER, ...inv,
    });
    const sumCrossN = makeSkill('Blood Infusion', {
        primary_tree: SUMMONING,
        secondary_tree: NECROMANCER, ...inv,
    });
    const sumCrossP = makeSkill('Fire Infusion', {
        primary_tree: SUMMONING,
        secondary_tree: PYROKINETIC, ...inv,
    });

    it('defaultSort groups by primaryTree, single before cross', () => {
        const input = [pyroCross, aeroCross, pyroSingle, aeroSingle];
        const result = defaultSort(input);

        expect(result).toStrictEqual([
            aeroSingle, aeroCross,
            pyroSingle, pyroCross,
        ]);
    });

    it('single before cross within same primary tree', () => {
        const input = [pyroCross, pyroSingle];
        const result = defaultSort(input);

        expect(result).toStrictEqual([pyroSingle, pyroCross]);
    });

    it('sorts by secondaryTree within cross-class', () => {
        const input = [sumCrossP, sumCrossN];
        const result = defaultSort(input);

        expect(result).toStrictEqual([sumCrossN, sumCrossP]);
    });

    it('sorts by investment within same tree group', () => {
        const inv1 = makeSkill('Haste', {
            primary_tree: PYROKINETIC, investment: 1,
        });
        const inv2 = makeSkill('Fireball', {
            primary_tree: PYROKINETIC, investment: 2,
        });
        const inv3 = makeSkill('Firebrand', {
            primary_tree: PYROKINETIC, investment: 3,
        });
        const result = defaultSort([inv3, inv1, inv2]);

        expect(result).toStrictEqual([inv1, inv2, inv3]);
    });

    it('sorts by name as tiebreaker', () => {
        const a = makeSkill('Alpha', {
            primary_tree: PYROKINETIC, investment: 1,
        });
        const b = makeSkill('Beta', {
            primary_tree: PYROKINETIC, investment: 1,
        });
        const result = defaultSort([b, a]);

        expect(result).toStrictEqual([a, b]);
    });
});

// ── summarize ───────────────────────────────────────────

describe('summarize', () => {
    it('no filters', () => {
        const result = summarize({ primary: null, any: null });
        expect(result).toBe('Showing all skills, tap to filter');
    });

    it('primary only', () => {
        const result = summarize({
            primary: PYROKINETIC, any: null,
        });
        expect(result).toBe(`Showing all ${PYROKINETIC} skills`);
    });

    it('primary + one filter', () => {
        const result = summarize({
            primary: PYROKINETIC, any: set(WARFARE),
        });
        expect(result)
            .toBe(`Showing all ${PYROKINETIC} skills, with ${WARFARE}`);
    });

    it('primary + two filters', () => {
        const result = summarize({
            primary: PYROKINETIC,
            any: set(WARFARE, NECROMANCER),
        });
        expect(result).toBe(
            `Showing all ${PYROKINETIC} skills,`
            + ` with ${WARFARE} or ${NECROMANCER}`
        );
    });

    it('one filter, no primary', () => {
        const result = summarize({
            primary: null, any: set(WARFARE),
        });
        expect(result).toBe(`Showing all ${WARFARE} skills`);
    });

    it('multiple filters, no primary', () => {
        const result = summarize({
            primary: null,
            any: set(WARFARE, NECROMANCER),
        });
        expect(result)
            .toBe(`Showing skills with ${WARFARE} or ${NECROMANCER}`);
    });
});
