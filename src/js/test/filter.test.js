import { describe, it, expect } from 'vitest';
import { makeSkill, set } from './helpers.js';
import {
    SUMMONING, PYROKINETIC, AEROTHEURGE, NECROMANCER, WARFARE,
} from '@constants';
import { defaultSort, summarize } from '@js/filter.js';

// ── sorting ─────────────────────────────────────────────

describe('sorting', () => {
    // Controlled fixtures with explicit investment
    const inv = { investment: 1 };
    const pyroSingle = makeSkill('Haste', [PYROKINETIC], inv);
    const aeroSingle = makeSkill('Blinding', [AEROTHEURGE], inv);
    const pyroCross = makeSkill(
        'Bleed Fire', [PYROKINETIC, NECROMANCER], inv,
    );
    const aeroCross = makeSkill(
        'Vacuum Touch', [AEROTHEURGE, NECROMANCER], inv,
    );
    const sumCrossN = makeSkill(
        'Blood Infusion', [SUMMONING, NECROMANCER], inv,
    );
    const sumCrossP = makeSkill(
        'Fire Infusion', [SUMMONING, PYROKINETIC], inv,
    );

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
        const inv1 = makeSkill('Haste', [PYROKINETIC], { investment: 1 });
        const inv2 = makeSkill('Fireball', [PYROKINETIC], { investment: 2 });
        const inv3 = makeSkill('Firebrand', [PYROKINETIC], { investment: 3 });
        const result = defaultSort([inv3, inv1, inv2]);

        expect(result).toStrictEqual([inv1, inv2, inv3]);
    });

    it('sorts by name as tiebreaker', () => {
        const a = makeSkill('Alpha', [PYROKINETIC], { investment: 1 });
        const b = makeSkill('Beta', [PYROKINETIC], { investment: 1 });
        const result = defaultSort([b, a]);

        expect(result).toStrictEqual([a, b]);
    });
});

// ── summarize ───────────────────────────────────────────

describe('summarize', () => {
    it('no filters', () => {
        const result = summarize(null, null);
        expect(result).toBe('Showing all skills, tap to filter');
    });

    it('primary only', () => {
        const result = summarize(PYROKINETIC, null);
        expect(result).toBe(`Showing all ${PYROKINETIC} skills`);
    });

    it('primary + one filter', () => {
        const result = summarize(PYROKINETIC, set(WARFARE));
        expect(result)
            .toBe(`Showing all ${PYROKINETIC} skills, with ${WARFARE}`);
    });

    it('primary + two filters', () => {
        const result = summarize(
            PYROKINETIC, set(WARFARE, NECROMANCER)
        );
        expect(result).toBe(
            `Showing all ${PYROKINETIC} skills,`
            + ` with ${WARFARE} or ${NECROMANCER}`
        );
    });

    it('one filter, no primary', () => {
        const result = summarize(null, set(WARFARE));
        expect(result).toBe(`Showing all ${WARFARE} skills`);
    });

    it('multiple filters, no primary', () => {
        const result = summarize(null, set(WARFARE, NECROMANCER));
        expect(result)
            .toBe(`Showing skills with ${WARFARE} or ${NECROMANCER}`);
    });
});
