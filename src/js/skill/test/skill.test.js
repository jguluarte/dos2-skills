import { fake } from 'zod-schema-faker/v4';
import { describe, it, expect, beforeEach } from 'vitest';

import { Skill, Schema as SkillSchema } from '@js/skill';

import { PYROKINETIC, POLYMORPH, WARFARE, NECROMANCER } from '@constants';

describe("Skill functionality", () => {
    let bleed_fire;
    beforeEach(() => {
        const s = fake(SkillSchema);
        s.primary_tree = POLYMORPH;
        s.secondary_tree = PYROKINETIC;

        bleed_fire = Skill.fromYAML(s);
    });

    describe('skill.has(tree)', () => {
        it('returns true for a tree the skill requires', () => {
            expect(bleed_fire.has(PYROKINETIC)).toBe(true);
            expect(bleed_fire.has(POLYMORPH)).toBe(true);
        });

        it('returns false for a tree the skill does not require', () => {
            expect(bleed_fire.has(WARFARE)).toBe(false);
            expect(bleed_fire.has(NECROMANCER)).toBe(false);
        });
    });

    describe('skill.any(trees)', () => {
        it('returns true when at least one tree matches', () => {
            expect(bleed_fire.any(new Set([PYROKINETIC, WARFARE]))).toBe(true);
        });

        it('returns false when no trees match', () => {
            expect(bleed_fire.any(new Set([WARFARE, NECROMANCER]))).toBe(false);
        });

        it('returns true for empty set (vacuously true)', () => {
            expect(bleed_fire.any(new Set())).toBe(true);
        });
    });
});

describe('skill derived values', () => {
    let raw;
    beforeEach(() => {
        raw = fake(SkillSchema);
        raw.primary_tree = POLYMORPH;
        raw.secondary_tree = PYROKINETIC;
    });

    it.each`
        ap_cost | sp_cost | expected
        ${0}    | ${0}    | ${false}
        ${1}    | ${0}    | ${true}
        ${0}    | ${1}    | ${true}
        ${1}    | ${1}    | ${true}
    `("hasCost: $expected with {ap: $ap_cost, sp: $sp_cost}", (testCase) => {
        raw.ap_cost = testCase.ap_cost;
        raw.sp_cost = testCase.sp_cost;

        const skill = Skill.fromYAML(raw);
        expect(skill.hasCost).toBe(testCase.expected);
    });
});
