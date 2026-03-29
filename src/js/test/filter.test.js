import { describe, it, expect } from 'vitest';
import { makeSkill, set } from './helpers.js';
import {
    SUMMONING, PYROKINETIC, AEROTHEURGE, HYDROSOPHIST,
    NECROMANCER, WARFARE,
} from '@constants';
import { defaultSort, filterSkills, summarize } from '@js/filter.js';

// ── fixtures ────────────────────────────────────────────

const pyroNecro = makeSkill('Pyro+Necro',    [PYROKINETIC, NECROMANCER]);
const aeroNecro = makeSkill('Aero+Necro',    [AEROTHEURGE, NECROMANCER]);
const pyroWar   = makeSkill('Pyro+Warfare',  [PYROKINETIC, WARFARE]);
const hydroWar  = makeSkill('Hydro+Warfare', [HYDROSOPHIST, WARFARE]);
const sumPyro   = makeSkill('Summon+Pyro',   [SUMMONING, PYROKINETIC]);
const sumNecro  = makeSkill('Summon+Necro',  [SUMMONING, NECROMANCER]);

const skills = [pyroNecro, aeroNecro, pyroWar, hydroWar, sumNecro, sumPyro];

// ── no filters ──────────────────────────────────────────

describe('no filters', () => {
    it('returns all skills', () => {
        const result = filterSkills(skills);
        expect(result).toHaveLength(skills.length);
        expect(new Set(result)).toEqual(new Set(skills));
    });
});

// ── primary filter ──────────────────────────────────────

describe('primary filter only', () => {
    const result = filterSkills(skills, PYROKINETIC);

    it('includes skills with that tree', () => {
        expect(result).toContain(pyroNecro);
        expect(result).toContain(pyroWar);
        expect(result).toHaveLength(2);
    });

    it.each(
        [aeroNecro, hydroWar, sumNecro]
    )('excludes skills without that tree', (skill) => {
        expect(result).not.toContain(skill);
    });

    it('excludes summoning skills', () => {
        expect(result).not.toContain(sumPyro);
    });
});

// ── summoning ───────────────────────────────────────────

describe('summoning', () => {
    it('shows only summoning skills when primary', () => {
        const result = filterSkills(skills, SUMMONING);
        expect(result).toHaveLength(2);
        expect(result).toContain(sumNecro);
        expect(result).toContain(sumPyro);
    });

    it('shows only summoning skills when secondary', () => {
        const result = filterSkills(skills, null, set(SUMMONING));
        expect(result).toHaveLength(2);
        expect(result).toContain(sumPyro);
        expect(result).toContain(sumNecro);
    });

    it('narrows by filter tree', () => {
        const result = filterSkills(skills, SUMMONING, set(NECROMANCER));
        expect(result).toStrictEqual([sumNecro]);
    });

    it('invalid combo returns empty', () => {
        const result = filterSkills(skills, SUMMONING, set(WARFARE));
        expect(result).toHaveLength(0);
    });
});

// ── filters ─────────────────────────────────────────────

describe('filters', () => {
    it('narrows to skills matching the filter', () => {
        const result = filterSkills(skills, PYROKINETIC, set(NECROMANCER));
        expect(result).toStrictEqual([pyroNecro]);
    });

    it('multiple filters match any (OR)', () => {
        const filters = set(NECROMANCER, WARFARE);
        const result = filterSkills(skills, PYROKINETIC, filters);

        expect(result).toContain(pyroNecro);
        expect(result).toContain(pyroWar);
        expect(result).toHaveLength(2);
    });
});

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

    it('primary filter sorts single before cross, then by other tree', () => {
        const input = [pyroCross, pyroSingle];
        const result = filterSkills(input, PYROKINETIC);

        expect(result).toStrictEqual([pyroSingle, pyroCross]);
    });

    it('secondary filter sorts by primaryTree then secondaryTree', () => {
        const input = [sumCrossP, sumCrossN];
        const result = filterSkills(input, null, set(SUMMONING));

        expect(result).toStrictEqual([sumCrossN, sumCrossP]);
    });

    it('sorts by investment within same tree group', () => {
        const inv1 = makeSkill('Haste',    [PYROKINETIC], { investment: 1 });
        const inv2 = makeSkill('Fireball',  [PYROKINETIC], { investment: 2 });
        const inv3 = makeSkill('Firebrand', [PYROKINETIC], { investment: 3 });
        const result = filterSkills([inv3, inv1, inv2], PYROKINETIC);

        expect(result).toStrictEqual([inv1, inv2, inv3]);
    });

    it('sorts by name as tiebreaker', () => {
        const a = makeSkill('Alpha', [PYROKINETIC], { investment: 1 });
        const b = makeSkill('Beta',  [PYROKINETIC], { investment: 1 });
        const result = filterSkills([b, a], PYROKINETIC);

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
