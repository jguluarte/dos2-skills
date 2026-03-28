import { describe, it, expect } from 'vitest';
import { makeSkill, set } from './helpers.js';
import {
    SUMMONING, PYROKINETIC, AEROTHEURGE, HYDROSOPHIST,
    NECROMANCER, WARFARE,
} from '@constants';
import { filterSkills } from '@js/filter.js';

// ── fixtures ────────────────────────────────────────────

const pyroNecro = makeSkill('Pyro+Necro',    [PYROKINETIC, NECROMANCER]);
const aeroNecro = makeSkill('Aero+Necro',    [AEROTHEURGE, NECROMANCER]);
const pyroWar   = makeSkill('Pyro+Warfare',  [PYROKINETIC, WARFARE]);
const hydroWar  = makeSkill('Hydro+Warfare', [HYDROSOPHIST, WARFARE]);
const sumPyro   = makeSkill('Summon+Pyro',   [SUMMONING, PYROKINETIC]);
const sumNecro  = makeSkill('Summon+Necro',  [SUMMONING, NECROMANCER]);

const skills = [pyroNecro, aeroNecro, pyroWar, hydroWar, sumPyro, sumNecro];

// ── no filters ──────────────────────────────────────────

describe('no filters', () => {
    it('returns all skills', () => {
        const result = filterSkills(skills);
        expect(result).toEqual(skills);
    });
});

// ── primary filter ──────────────────────────────────────

describe('primary filter only', () => {
    const result = filterSkills(skills, PYROKINETIC);

    it('includes skills with that tree', () => {
        expect(result).toStrictEqual([pyroNecro, pyroWar]);
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
        expect(result).toStrictEqual([sumPyro, sumNecro]);
    });

    it('shows only summoning skills when secondary', () => {
        const result = filterSkills(skills, null, set(SUMMONING));
        expect(result).toStrictEqual([sumPyro, sumNecro]);
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

        expect(result).toStrictEqual([pyroNecro, pyroWar]);
    });
});
