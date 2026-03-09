import { describe, it, expect } from 'vitest';
import { Skill } from '../js/skill.js';
import {
    MissingNameError, MissingRequirementsError, MissingEffectError,
    UnknownTreeError, PrerequisiteError, MissingPrimaryTreeError,
    InvalidPrimaryTreeError,
} from '../js/errors.js';
import {
    SUMMONING, PYROKINETIC, POLYMORPH, WARFARE, NECROMANCER, GEOMANCER,
} from '../js/constants.js';

// ── construction & properties ───────────────────────────

describe('Skill construction', () => {
    const raw = {
        name: 'Bleed Fire',
        requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
        primary_tree: PYROKINETIC,
        url: 'https://example.com/bleed-fire',
        ap_cost: 1,
        sp_cost: 0,
        range: '13m',
        cooldown: 3,
        effect: 'Enemies bleed fire when hit.',
    };
    const skill = new Skill(raw);

    it('exposes name', () => {
        expect(skill.name).toBe('Bleed Fire');
    });

    it('exposes trees as sorted array of requirement keys', () => {
        expect(skill.trees).toEqual([POLYMORPH, PYROKINETIC]);
    });

    it('exposes requirements map', () => {
        expect(skill.requirements).toEqual(
            { [PYROKINETIC]: 1, [POLYMORPH]: 1 }
        );
    });

    it('exposes apCost', () => {
        expect(skill.apCost).toBe(1);
    });

    it('exposes spCost', () => {
        expect(skill.spCost).toBe(0);
    });

    it('exposes range', () => {
        expect(skill.range).toBe('13m');
    });

    it('exposes cooldown', () => {
        expect(skill.cooldown).toBe(3);
    });

    it('exposes effect', () => {
        expect(skill.effect).toBe('Enemies bleed fire when hit.');
    });

    it('exposes url', () => {
        expect(skill.url).toBe('https://example.com/bleed-fire');
    });
});

describe('Skill construction with missing optional fields', () => {
    const raw = {
        name: 'Minimal Skill',
        requirements: { [WARFARE]: 2, [GEOMANCER]: 1 },
        primary_tree: GEOMANCER,
        ap_cost: 2,
        sp_cost: 1,
        effect: 'Does something.',
    };
    const skill = new Skill(raw);

    it('url defaults to null', () => {
        expect(skill.url).toBeNull();
    });

    it('range defaults to null', () => {
        expect(skill.range).toBeNull();
    });

    it('cooldown defaults to null', () => {
        expect(skill.cooldown).toBeNull();
    });
});

describe('Skill defaults for cost fields', () => {
    const skill = new Skill({
        name: 'No Costs',
        requirements: { [PYROKINETIC]: 1, [WARFARE]: 1 },
        primary_tree: PYROKINETIC,
        effect: 'test',
    });

    it('apCost defaults to 0 when missing', () => {
        expect(skill.apCost).toBe(0);
    });

    it('spCost defaults to 0 when missing', () => {
        expect(skill.spCost).toBe(0);
    });
});

// ── validation ──────────────────────────────────────────

describe('Skill validation', () => {
    it('missing name throws MissingNameError', () => {
        expect(() => new Skill({
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            effect: 'test',
        })).toThrow(MissingNameError);
    });

    it('missing requirements throws MissingRequirementsError', () => {
        expect(() => new Skill({
            name: 'Bad Skill',
            effect: 'test',
        })).toThrow(MissingRequirementsError);
    });

    it('empty requirements throws MissingRequirementsError', () => {
        expect(() => new Skill({
            name: 'Bad Skill',
            requirements: {},
            effect: 'test',
        })).toThrow(MissingRequirementsError);
    });

    it('missing effect throws MissingEffectError', () => {
        expect(() => new Skill({
            name: 'Bad Skill',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
        })).toThrow(MissingEffectError);
    });

    it('unknown tree name throws UnknownTreeError', () => {
        expect(() => new Skill({
            name: 'Bad Skill',
            requirements: { FakeTree: 1, [PYROKINETIC]: 1 },
            effect: 'test',
        })).toThrow(UnknownTreeError);
    });

    it('non-positive level throws PrerequisiteError', () => {
        expect(() => new Skill({
            name: 'Bad Skill',
            requirements: { [PYROKINETIC]: 0, [POLYMORPH]: 1 },
            effect: 'test',
        })).toThrow(PrerequisiteError);
    });
});

// ── filter methods ──────────────────────────────────────

describe('Skill.has(tree)', () => {
    const skill = new Skill({
        name: 'Bleed Fire',
        requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
        primary_tree: PYROKINETIC,
        ap_cost: 1, sp_cost: 0,
        effect: 'test',
    });

    it('returns true for a tree the skill requires', () => {
        expect(skill.has(PYROKINETIC)).toBe(true);
        expect(skill.has(POLYMORPH)).toBe(true);
    });

    it('returns false for a tree the skill does not require', () => {
        expect(skill.has(WARFARE)).toBe(false);
        expect(skill.has(SUMMONING)).toBe(false);
    });
});

describe('Skill.any(trees)', () => {
    const skill = new Skill({
        name: 'Bleed Fire',
        requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
        primary_tree: PYROKINETIC,
        ap_cost: 1, sp_cost: 0,
        effect: 'test',
    });

    it('returns true when at least one tree matches', () => {
        expect(skill.any(new Set([PYROKINETIC, WARFARE]))).toBe(true);
    });

    it('returns false when no trees match', () => {
        expect(skill.any(new Set([WARFARE, NECROMANCER]))).toBe(false);
    });

    it('returns true for empty set (vacuously true)', () => {
        expect(skill.any(new Set())).toBe(true);
    });
});

describe('Skill.isSummoning', () => {
    it('returns true for summoning skills', () => {
        const skill = new Skill({
            name: 'Conjure Incarnate',
            requirements: { [SUMMONING]: 1, [PYROKINETIC]: 1 },
            primary_tree: SUMMONING,
            ap_cost: 2, sp_cost: 0,
            effect: 'test',
        });
        expect(skill.isSummoning).toBe(true);
    });

    it('returns false for non-summoning skills', () => {
        const skill = new Skill({
            name: 'Bleed Fire',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        });
        expect(skill.isSummoning).toBe(false);
    });
});

// ── primaryTree / secondaryTree ────────────────────────

describe('Skill reads primary_tree from raw data', () => {
    it('uses primary_tree field directly', () => {
        const skill = new Skill({
            name: 'Bleed Fire',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        });
        expect(skill.primaryTree).toBe(PYROKINETIC);
        expect(skill.secondaryTree).toBe(POLYMORPH);
    });

    it('summoning primary_tree', () => {
        const skill = new Skill({
            name: 'Fire Infusion',
            requirements: { [SUMMONING]: 1, [PYROKINETIC]: 1 },
            primary_tree: SUMMONING,
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        });
        expect(skill.primaryTree).toBe(SUMMONING);
        expect(skill.secondaryTree).toBe(PYROKINETIC);
    });

    it('throws when primary_tree is missing', () => {
        expect(() => new Skill({
            name: 'No Primary',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        })).toThrow(MissingPrimaryTreeError);
    });

    it('throws when primary_tree is not in requirements', () => {
        expect(() => new Skill({
            name: 'Bad Primary',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: WARFARE,
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        })).toThrow(InvalidPrimaryTreeError);
    });
});
