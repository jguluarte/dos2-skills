const { test, describe, it, assert } = require('./test.js');
const { buildSkill } = require('./helpers.js');

const {
    SUMMONING, PYROKINETIC, AEROTHEURGE, HYDROSOPHIST, NECROMANCER, WARFARE,
} = require('../js/constants.js');

const { shouldSkillShow } = require('../js/filter-logic.js');


// ── helpers ──────────────────────────────────────────────

function getVisibleSkills(skills, primary, secondary = []) {
    const secondarySet = new Set(secondary);
    return skills
        .filter(s =>
            shouldSkillShow(s.trees, primary, secondarySet))
        .map(s => s.name)
        .sort();
}

// ── filter matching ─────────────────────────────────────

test('filters behave as expected', () => {
    const pyroNecro = buildSkill('Pyro+Necro', [PYROKINETIC, NECROMANCER]);
    const aeroNecro = buildSkill('Aero+Necro', [AEROTHEURGE, NECROMANCER]);
    const pyroWar = buildSkill('Pyro+Warfare', [PYROKINETIC, WARFARE]);
    const hydroWar = buildSkill('Hydro+Warfare', [HYDROSOPHIST, WARFARE]);
    const sumPyro = buildSkill('Summon+Pyro', [SUMMONING, PYROKINETIC]);
    const sumNecro = buildSkill('Summon+Necro', [SUMMONING, NECROMANCER]);

    const skills = [pyroNecro, aeroNecro, pyroWar, hydroWar, sumPyro, sumNecro];

    const allNames = skills.map(s => s.name).sort();
    const summonNames = [sumNecro, sumPyro].map(s => s.name).sort();

    it('An absence of a filter renders all skills', () => {
        assert.deepEqual(getVisibleSkills(skills, null), allNames);
    });

    it('Invalid combination results in an empty list', () => {
        // This combination doesn't exist in `skills`
        const found = getVisibleSkills(skills, SUMMONING, [WARFARE]);
        assert.equal(found.length, 0);
    });

    describe(`${SUMMONING} skills behave differently...`, () => {
        const nonSummonFilters = [
            PYROKINETIC, AEROTHEURGE, NECROMANCER, WARFARE,
        ];

        // What is common expected behavior for these trees?
        for (const tree of nonSummonFilters) {
            describe(`${tree} as the primary filter...`, () => {
                const found = getVisibleSkills(skills, tree);

                it(`finds skills`, () => {
                    assert.ok(found.length > 0);
                });

                it(`does not include summoning skills`, () => {
                    assert.ok( summonNames.every(n => !found.includes(n)) );
                });
            });
        }

        describe('Summoning as the primary filter...', () => {

            it('all summoning skills can be found', () => {
                const found = getVisibleSkills(skills, SUMMONING);
                assert.deepEqual(found, summonNames);
            });

            for (const skill of [sumNecro, sumPyro]) {
                const tree = skill.trees.find(t => t !== SUMMONING);
                const found = getVisibleSkills(skills, SUMMONING, [tree]);

                it(`can find ${skill.name} filtering by ${tree}`, () => {
                    assert.equal(found.length, 1);
                    assert.equal(found[0], skill.name);
                });
            }

        });
    });

    describe(`Primary filter --> ${NECROMANCER}`, () => {
        it('finds two skills', () => {
            const found = getVisibleSkills(skills, NECROMANCER);
            assert.equal(found.length, 2);
        });

        for (const skill of [pyroNecro, aeroNecro]) {
            const tree = skill.trees.find(
                t => t !== NECROMANCER);
            const found = getVisibleSkills(skills, NECROMANCER, [tree]);

            it(`can find ${skill.name} filtering by ${tree}`, () => {
                assert.equal(found.length, 1);
                assert.equal(found[0], skill.name);
            });
        }
    });

    describe('secondary filters only', () => {
        it('finds four skills', () => {
            const expected = [pyroNecro, aeroNecro, pyroWar, hydroWar];

            assert.deepEqual(
                getVisibleSkills(skills, null, [NECROMANCER, WARFARE]),
                expected.map(s => s.name).sort()
            );
        });

    });
});
