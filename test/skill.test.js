import { describe, it, expect } from 'vitest';
import { Skill } from '../js/skill.ts';
import {
    MissingNameError, MissingRequirementsError, MissingEffectError,
    UnknownTreeError, PrerequisiteError, MissingPrimaryTreeError,
    InvalidPrimaryTreeError,
} from '../js/errors.ts';
import {
    SUMMONING, PYROKINETIC, POLYMORPH, WARFARE, NECROMANCER, GEOMANCER,
} from '../js/constants.ts';

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

    it('exposes trees as [secondary, primary]', () => {
        expect(skill.trees).toEqual([POLYMORPH, PYROKINETIC]);
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

// ── investment ──────────────────────────────────────────

describe('Skill.investment', () => {
    it('derives investment from requirements values', () => {
        const skill = new Skill({
            name: 'Level 2',
            requirements: { [PYROKINETIC]: 2, [POLYMORPH]: 2 },
            primary_tree: PYROKINETIC,
            effect: 'test',
        });
        expect(skill.investment).toBe(2);
    });

    it('works for level 1 skills', () => {
        const skill = new Skill({
            name: 'Level 1',
            requirements: { [WARFARE]: 1, [NECROMANCER]: 1 },
            primary_tree: WARFARE,
            effect: 'test',
        });
        expect(skill.investment).toBe(1);
    });
});

// ── icon arrays ─────────────────────────────────────────

describe('Skill.apIcons', () => {
    it('returns array matching apCost length', () => {
        const skill = new Skill({
            name: 'Test',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            ap_cost: 3, effect: 'test',
        });
        expect(skill.apIcons.length).toBe(3);
    });

    it('returns empty array when apCost is 0', () => {
        const skill = new Skill({
            name: 'Test',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            effect: 'test',
        });
        expect(skill.apIcons.length).toBe(0);
    });
});

describe('Skill.spIcons', () => {
    it('returns array matching spCost length', () => {
        const skill = new Skill({
            name: 'Test',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            sp_cost: 2, effect: 'test',
        });
        expect(skill.spIcons.length).toBe(2);
    });

    it('returns empty array when spCost is 0', () => {
        const skill = new Skill({
            name: 'Test',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            effect: 'test',
        });
        expect(skill.spIcons.length).toBe(0);
    });
});

// ── computed properties ─────────────────────────────────

describe('Skill.hasCost', () => {
    it('true when apCost > 0', () => {
        const skill = new Skill({
            name: 'AP Only',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        });
        expect(skill.hasCost).toBe(true);
    });

    it('true when spCost > 0', () => {
        const skill = new Skill({
            name: 'SP Only',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            ap_cost: 0, sp_cost: 1,
            effect: 'test',
        });
        expect(skill.hasCost).toBe(true);
    });

    it('false when both costs are 0', () => {
        const skill = new Skill({
            name: 'Free',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            effect: 'test',
        });
        expect(skill.hasCost).toBe(false);
    });
});

describe('Skill.hasMetadata', () => {
    it('true when range exists', () => {
        const skill = new Skill({
            name: 'Ranged',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            range: '13m',
            effect: 'test',
        });
        expect(skill.hasMetadata).toBe(true);
    });

    it('true when cooldown exists', () => {
        const skill = new Skill({
            name: 'Cooldown',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            cooldown: 3,
            effect: 'test',
        });
        expect(skill.hasMetadata).toBe(true);
    });

    it('false when neither exists', () => {
        const skill = new Skill({
            name: 'No Meta',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            effect: 'test',
        });
        expect(skill.hasMetadata).toBe(false);
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
