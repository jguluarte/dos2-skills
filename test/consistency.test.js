const { test, it, assert } = require('./test.js');
const mock = require('./mock.js');

const {
    SUMMONING, PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST, WARFARE,
    HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER, ELEMENTAL_TREES,
    NON_ELEMENTAL_TREES, ALL_TREES,
} = require('../js/constants.js');

const {
    getValidSecondaryOptions,
    buildSummaryText,
    groupSkillsByElement,
} = require('../js/filter-logic.js');


test('tree constants', () => {
    it('ELEMENTAL_TREES', () => {
        assert.deepEqual(
            ELEMENTAL_TREES,
            [PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST]);
    });

    it('NON_ELEMENTAL_TREES', () => {
        assert.deepEqual(
            NON_ELEMENTAL_TREES,
            [WARFARE, HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER]
        );
    });

    it('ALL_TREES', () => {
        assert.deepEqual(ALL_TREES, [
            PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST, WARFARE,
            HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER, SUMMONING,
        ]);
    });
});

test('valid secondary options', () => {
    it('Summoning pairs with elementals + Necromancer', () => {
        assert.deepEqual(getValidSecondaryOptions(SUMMONING),
            [...ELEMENTAL_TREES, NECROMANCER]);
    });

    for (const tree of ELEMENTAL_TREES) {
        it(`${tree} pairs with non-elementals`, () => {
            assert.deepEqual(
                getValidSecondaryOptions(tree),
                NON_ELEMENTAL_TREES);
        });
    }

    for (const tree of NON_ELEMENTAL_TREES) {
        it(`${tree} pairs with elementals`, () => {
            assert.deepEqual(
                getValidSecondaryOptions(tree),
                ELEMENTAL_TREES);
        });
    }
});

test('skill grouping', () => {
    const sumPyro = mock.skill('Sum+Pyro', [SUMMONING, PYROKINETIC]);
    const sumGeo = mock.skill('Sum+Geo', [SUMMONING, GEOMANCER]);
    const pyroNec = mock.skill('Pyro+Nec', [PYROKINETIC, NECROMANCER]);
    const pyroWar = mock.skill('Pyro+War', [PYROKINETIC, WARFARE]);
    const aeroNec = mock.skill('Aero+Nec', [AEROTHEURGE, NECROMANCER]);
    const airNec = mock.skill('Air+Nec', [AEROTHEURGE, NECROMANCER]);
    const geoHunt = mock.skill('Geo+Hunt', [GEOMANCER, HUNTSMAN]);
    const geoPoly = mock.skill('Geo+Poly', [GEOMANCER, POLYMORPH]);
    const hydroNec = mock.skill('Hydro+Nec', [HYDROSOPHIST, NECROMANCER]);
    const hydroRog = mock.skill('Hydro+Rog', [HYDROSOPHIST, SCOUNDREL]);

    const skills = [
        sumPyro, sumGeo, pyroNec, pyroWar, aeroNec,
        airNec, geoHunt, geoPoly, hydroNec, hydroRog,
    ];
    const grouped = groupSkillsByElement(skills);

    it('Summoning group', () => {
        assert.deepEqual(grouped[SUMMONING], [sumPyro, sumGeo]);
    });

    it('Pyrokinetic group', () => {
        assert.deepEqual(grouped[PYROKINETIC], [pyroNec, pyroWar]);
    });

    it('Aerotheurge group', () => {
        assert.deepEqual(grouped[AEROTHEURGE], [aeroNec, airNec]);
    });

    it('Geomancer group', () => {
        assert.deepEqual(grouped[GEOMANCER], [geoHunt, geoPoly]);
    });

    it('Hydrosophist group', () => {
        assert.deepEqual(grouped[HYDROSOPHIST], [hydroNec, hydroRog]);
    });
});


test('summary text', () => {
    it('no filters: "Showing all skills"', () => {
        assert.equal(
            buildSummaryText(null, new Set()),
            'Showing all skills');
    });

    it('primary only', () => {
        assert.equal(
            buildSummaryText(PYROKINETIC, new Set()),
            `Showing all ${PYROKINETIC} skills`);
    });

    it('primary + secondary', () => {
        assert.equal(
            buildSummaryText(PYROKINETIC, new Set([WARFARE])),
            `Showing all ${PYROKINETIC} skills, with ${WARFARE}`);
    });

    it('primary + two secondaries', () => {
        const expected = (
            `Showing all ${PYROKINETIC} skills, with ${WARFARE} or `
            + NECROMANCER
        );
        assert.equal(
            buildSummaryText(PYROKINETIC, new Set([WARFARE, NECROMANCER])),
            expected);
    });

    it('single secondary only', () => {
        assert.equal(
            buildSummaryText(null, new Set([WARFARE])),
            `Showing all ${WARFARE} skills`);
    });

    it('multiple secondaries joins with "or"', () => {
        assert.equal(
            buildSummaryText(null, new Set([WARFARE, NECROMANCER])),
            `Showing skills with ${WARFARE} or ${NECROMANCER}`);
    });
});
