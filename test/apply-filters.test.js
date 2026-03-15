import { describe, it, expect } from 'vitest';
import { makeSkill } from './helpers.js';
import {
    SUMMONING, PYROKINETIC, AEROTHEURGE, HYDROSOPHIST, NECROMANCER, WARFARE,
} from '../js/constants.js';
import { shouldSkillShow } from '../js/filter-logic.js';

// ── helpers ──────────────────────────────────────────────

function getVisibleSkills(skills, primary, secondary = []) {
    const secondarySet = new Set(secondary);
    return skills
        .filter((skill) =>
            shouldSkillShow(skill.trees, primary, secondarySet))
        .map((skill) => skill.name)
        .sort();
}

// ── filter matching ─────────────────────────────────────

describe('filters behave as expected', () => {
    const pyroNecro = makeSkill('Pyro+Necro', [PYROKINETIC, NECROMANCER]);
    const aeroNecro = makeSkill('Aero+Necro', [AEROTHEURGE, NECROMANCER]);
    const pyroWar = makeSkill('Pyro+Warfare', [PYROKINETIC, WARFARE]);
    const hydroWar = makeSkill('Hydro+Warfare', [HYDROSOPHIST, WARFARE]);
    const sumPyro = makeSkill('Summon+Pyro', [SUMMONING, PYROKINETIC]);
    const sumNecro = makeSkill('Summon+Necro', [SUMMONING, NECROMANCER]);

    const skills = [pyroNecro, aeroNecro, pyroWar, hydroWar, sumPyro, sumNecro];
    const allNames = skills.map((s) => s.name).sort();
    const summonNames = [sumNecro, sumPyro].map((s) => s.name).sort();

    it('An absence of a filter renders all skills', () => {
        expect(getVisibleSkills(skills, null)).toEqual(allNames);
    });

    it('Invalid combination results in an empty list', () => {
        const found = getVisibleSkills(skills, SUMMONING, [WARFARE]);
        expect(found.length).toBe(0);
    });

    describe(`${SUMMONING} skills behave differently...`, () => {
        const nonSummonFilters = [
            PYROKINETIC, AEROTHEURGE, NECROMANCER, WARFARE,
        ];

        for (const tree of nonSummonFilters) {
            describe(`${tree} as the primary filter...`, () => {
                const found = getVisibleSkills(skills, tree);

                it('finds skills', () => {
                    expect(found.length).toBeGreaterThan(0);
                });

                it('does not include summoning skills', () => {
                    expect(
                        summonNames.every((n) => !found.includes(n))
                    ).toBe(true);
                });
            });
        }

        describe('Summoning as the primary filter...', () => {
            it('all summoning skills can be found', () => {
                const found = getVisibleSkills(skills, SUMMONING);
                expect(found).toEqual(summonNames);
            });

            for (const skill of [sumNecro, sumPyro]) {
                const found = getVisibleSkills(
                    skills, SUMMONING, [skill.secondaryTree]);

                it(`finds ${skill.name} by ${skill.secondaryTree}`, () => {
                    expect(found.length).toBe(1);
                    expect(found[0]).toBe(skill.name);
                });
            }
        });
    });

    describe(`Primary filter --> ${NECROMANCER}`, () => {
        it('finds two skills', () => {
            const found = getVisibleSkills(skills, NECROMANCER);
            expect(found.length).toBe(2);
        });

        for (const skill of [pyroNecro, aeroNecro]) {
            const found = getVisibleSkills(
                skills, NECROMANCER, [skill.primaryTree]);

            it(`finds ${skill.name} by ${skill.primaryTree}`, () => {
                expect(found.length).toBe(1);
                expect(found[0]).toBe(skill.name);
            });
        }
    });

    describe('secondary filters only', () => {
        it('finds four skills', () => {
            const expected = [pyroNecro, aeroNecro, pyroWar, hydroWar];

            expect(
                getVisibleSkills(skills, null, [NECROMANCER, WARFARE])
            ).toEqual(expected.map((s) => s.name).sort());
        });
    });
});
