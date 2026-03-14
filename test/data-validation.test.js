import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import jsyaml from 'js-yaml';
import {
    VALID_SKILL_COMBINATION, SUMMONING,
} from '../js/constants.ts';

const yamlPath = path.resolve(import.meta.dirname, '../data/skills.yaml');
const yamlText = fs.readFileSync(yamlPath, 'utf8');
const skills = jsyaml.load(yamlText);

// ── aggregate checks ────────────────────────────────────

describe('skills.yaml :: file format', () => {
    it('data begins as an array', () => {
        expect(Array.isArray(skills)).toBe(true);
    });

    it('the array is not empty', () => {
        expect(skills.length).toBeGreaterThan(0);
    });

    it('no duplicate skill names', () => {
        const names = skills.map(s => s.name);
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);
        expect(dupes).toEqual([]);
    });
});

// ── per-skill validation ────────────────────────────────

describe('Skill validation', () => {
    it('no duplicate skills', () => {
        const names = skills.map(s => s.name);
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);
        expect(dupes).toEqual([]);
    });

    for (const skill of skills) {
        describe(skill.name, () => {
            const { name: skillName, requirements } = skill;
            const prerequisites = Object.keys(requirements);

            // structure
            it('has a name', () => {
                expect(skillName).toBeTruthy();
                expect(skillName.length).toBeGreaterThan(0);
            });

            it('has prerequisites', () => {
                expect(requirements).toBeTruthy();
                expect(requirements).toBeInstanceOf(Object);
            });

            // requirements
            // FIXME - this will change when we import all skills
            it('has exactly 2 prerequisites', () => {
                expect(prerequisites.length).toBe(2);
            });

            it('skill prerequisites are valid combinations', () => {
                const [a, b] = prerequisites;
                const [primary, secondary] =
                    b === SUMMONING ? [b, a] : [a, b];

                expect(
                    VALID_SKILL_COMBINATION[primary].includes(secondary)
                ).toBe(true);
            });

            for (const [tree, level] of Object.entries(requirements)) {
                it(`prerequisite ${tree} is valid`, () => {
                    expect(Number.isInteger(level)).toBe(true);
                    expect(level).toBeGreaterThan(0);
                });
            }

            it('ap_cost is valid', () => {
                expect(Number.isInteger(skill.ap_cost)).toBe(true);
                expect(skill.ap_cost).toBeGreaterThanOrEqual(0);
            });

            it('sp_cost is valid', () => {
                expect(Number.isInteger(skill.sp_cost)).toBe(true);
                expect(skill.sp_cost).toBeGreaterThanOrEqual(0);
            });

            if (skill.cooldown !== undefined) {
                it('cooldown is a valid number', () => {
                    expect(Number.isInteger(skill.cooldown)).toBe(true);
                    expect(skill.cooldown).toBeGreaterThanOrEqual(0);
                });
            } else {
                it('cooldown is appropriately undefined', () => {
                    expect(skill.cooldown).toBeUndefined();
                });
            }

            it('range is valid', () => {
                expect(skill.range).toMatch(
                    /^(Self|PB AoE|All allies|\d+m)$/
                );
            });

            it('has ability text', () => {
                expect(skill.effect.trim().length).toBeGreaterThan(0);
            });

            it('has a primary_tree field', () => {
                expect(skill.primary_tree).toBeTruthy();
            });

            it('primary_tree is one of the prerequisites', () => {
                expect(
                    prerequisites.includes(skill.primary_tree)
                ).toBe(true);
            });

            if (skill.url) {
                it('url is a valid URL', () => {
                    expect(() => new URL(skill.url)).not.toThrow();
                });
            } else {
                it('url is appropriately undefined', () => {
                    expect(skill.url).toBeUndefined();
                });
            }
        });
    }
});
