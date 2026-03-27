import { describe, it, expect } from 'vitest';
import { makeSkill } from './helpers.js';
import {
    SUMMONING, PYROKINETIC, AEROTHEURGE, HYDROSOPHIST, NECROMANCER, WARFARE,
    SCOUNDREL,
} from '@constants';
import { shouldSkillShow } from '@js/filter-logic.js';

// ── helpers ──────────────────────────────────────────────

function visible(skills, filters) {
    return skills
        .filter((skill) => shouldSkillShow(skill, filters))
        .map((skill) => skill.name)
        .sort();
}

// ── fixtures ─────────────────────────────────────────────

const pyroNecro = makeSkill('Pyro+Necro',    [PYROKINETIC, NECROMANCER]);
const aeroNecro = makeSkill('Aero+Necro',    [AEROTHEURGE, NECROMANCER]);
const pyroWar   = makeSkill('Pyro+Warfare',  [PYROKINETIC, WARFARE]);
const hydroWar  = makeSkill('Hydro+Warfare', [HYDROSOPHIST, WARFARE]);
const sumPyro   = makeSkill('Summon+Pyro',   [SUMMONING, PYROKINETIC]);
const sumNecro  = makeSkill('Summon+Necro',  [SUMMONING, NECROMANCER]);

const skills = [pyroNecro, aeroNecro, pyroWar, hydroWar, sumPyro, sumNecro];

// ── no filter = empty ────────────────────────────────────

describe('default state', () => {
    it('shows nothing without a primary filter', () => {
        expect(visible(skills, {})).toEqual([]);
    });

    it('shows nothing with only secondary', () => {
        expect(visible(skills, { secondary: WARFARE })).toEqual([]);
    });
});

// ── primary filter ───────────────────────────────────────

describe('primary filter', () => {
    it('shows all skills with that tree', () => {
        const found = visible(skills, { primary: PYROKINETIC });
        expect(found).toContain(pyroNecro.name);
        expect(found).toContain(pyroWar.name);
    });

    it('does not show skills without that tree', () => {
        const found = visible(skills, { primary: PYROKINETIC });
        expect(found).not.toContain(hydroWar.name);
        expect(found).not.toContain(aeroNecro.name);
    });

    it('matches regardless of primary/secondary position in data', () => {
        // NECROMANCER is secondary_tree in pyroNecro and aeroNecro
        const found = visible(skills, { primary: NECROMANCER });
        expect(found).toContain(pyroNecro.name);
        expect(found).toContain(aeroNecro.name);
    });
});

// ── secondary filter (narrows cross-class) ───────────────

describe('secondary filter', () => {
    it('narrows to specific pairing', () => {
        const found = visible(skills, {
            primary: PYROKINETIC,
            secondary: NECROMANCER,
        });
        expect(found).toEqual([pyroNecro.name]);
    });

    it('invalid pairing shows nothing', () => {
        const found = visible(skills, {
            primary: SUMMONING,
            secondary: WARFARE,
        });
        expect(found).toEqual([]);
    });
});

// ── summoning isolation ──────────────────────────────────

describe('summoning', () => {
    it('only shows when explicitly selected', () => {
        const found = visible(skills, { primary: SUMMONING });
        expect(found).toContain(sumPyro.name);
        expect(found).toContain(sumNecro.name);
        expect(found.length).toBe(2);
    });

    it('excluded from non-summoning primary', () => {
        const found = visible(skills, { primary: PYROKINETIC });
        expect(found).not.toContain(sumPyro.name);
    });

    it('narrows by secondary', () => {
        const found = visible(skills, {
            primary: SUMMONING,
            secondary: NECROMANCER,
        });
        expect(found).toEqual([sumNecro.name]);
    });
});

// ── skill type toggles ──────────────────────────────────

describe('skill type toggles', () => {
    // NOTE: all current fixtures are cross-class (two trees).
    // When single-tree skills exist, these tests expand.

    it('cross-class OFF hides dual-tree skills', () => {
        const found = visible(skills, {
            primary: PYROKINETIC,
            showCrossClass: false,
        });
        expect(found).toEqual([]);
    });

    it('single-tree OFF has no effect on dual-tree skills', () => {
        const found = visible(skills, {
            primary: PYROKINETIC,
            showSingleTree: false,
        });
        // all pyro skills are cross-class, so they still show
        expect(found.length).toBeGreaterThan(0);
    });

    it('both OFF shows nothing', () => {
        const found = visible(skills, {
            primary: PYROKINETIC,
            showCrossClass: false,
            showSingleTree: false,
        });
        expect(found).toEqual([]);
    });
});
