const { test, it, assert } = require('./test.js');

const { Skill } = require('../js/skill.js');
const {
    MissingNameError, MissingRequirementsError, MissingEffectError,
    UnknownTreeError, PrerequisiteError, MissingPrimaryTreeError,
    InvalidPrimaryTreeError,
} = require('../js/errors.js');
const {
    SUMMONING, PYROKINETIC, POLYMORPH, WARFARE, NECROMANCER, GEOMANCER,
} = require('../js/constants.js');

// ── construction & properties ───────────────────────────

test('Skill construction', () => {
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
        assert.equal(skill.name, 'Bleed Fire');
    });

    it('exposes trees as sorted array of requirement keys', () => {
        assert.deepEqual(skill.trees, [POLYMORPH, PYROKINETIC]);
    });

    it('exposes requirements map', () => {
        assert.deepEqual(
            skill.requirements,
            { [PYROKINETIC]: 1, [POLYMORPH]: 1 }
        );
    });

    it('exposes apCost', () => {
        assert.equal(skill.apCost, 1);
    });

    it('exposes spCost', () => {
        assert.equal(skill.spCost, 0);
    });

    it('exposes range', () => {
        assert.equal(skill.range, '13m');
    });

    it('exposes cooldown', () => {
        assert.equal(skill.cooldown, 3);
    });

    it('exposes effect', () => {
        assert.equal(skill.effect, 'Enemies bleed fire when hit.');
    });

    it('exposes url', () => {
        assert.equal(skill.url, 'https://example.com/bleed-fire');
    });
});

test('Skill construction with missing optional fields', () => {
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
        assert.equal(skill.url, null);
    });

    it('range defaults to null', () => {
        assert.equal(skill.range, null);
    });

    it('cooldown defaults to null', () => {
        assert.equal(skill.cooldown, null);
    });
});

test('Skill defaults for cost fields', () => {
    const skill = new Skill({
        name: 'No Costs',
        requirements: { [PYROKINETIC]: 1, [WARFARE]: 1 },
        primary_tree: PYROKINETIC,
        effect: 'test',
    });

    it('apCost defaults to 0 when missing', () => {
        assert.equal(skill.apCost, 0);
    });

    it('spCost defaults to 0 when missing', () => {
        assert.equal(skill.spCost, 0);
    });
});

// ── validation ──────────────────────────────────────────

test('Skill validation', () => {
    it('missing name throws MissingNameError', () => {
        assert.throws(() => new Skill({
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            effect: 'test',
        }), MissingNameError);
    });

    it('missing requirements throws MissingRequirementsError', () => {
        assert.throws(() => new Skill({
            name: 'Bad Skill',
            effect: 'test',
        }), MissingRequirementsError);
    });

    it('empty requirements throws MissingRequirementsError', () => {
        assert.throws(() => new Skill({
            name: 'Bad Skill',
            requirements: {},
            effect: 'test',
        }), MissingRequirementsError);
    });

    it('missing effect throws MissingEffectError', () => {
        assert.throws(() => new Skill({
            name: 'Bad Skill',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
        }), MissingEffectError);
    });

    it('unknown tree name throws UnknownTreeError', () => {
        assert.throws(() => new Skill({
            name: 'Bad Skill',
            requirements: { FakeTree: 1, [PYROKINETIC]: 1 },
            effect: 'test',
        }), UnknownTreeError);
    });

    it('non-positive level throws PrerequisiteError', () => {
        assert.throws(() => new Skill({
            name: 'Bad Skill',
            requirements: { [PYROKINETIC]: 0, [POLYMORPH]: 1 },
            effect: 'test',
        }), PrerequisiteError);
    });
});

// ── filter methods ──────────────────────────────────────

test('Skill.has(tree)', () => {
    const skill = new Skill({
        name: 'Bleed Fire',
        requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
        primary_tree: PYROKINETIC,
        ap_cost: 1, sp_cost: 0,
        effect: 'test',
    });

    it('returns true for a tree the skill requires', () => {
        assert.equal(skill.has(PYROKINETIC), true);
        assert.equal(skill.has(POLYMORPH), true);
    });

    it('returns false for a tree the skill does not require', () => {
        assert.equal(skill.has(WARFARE), false);
        assert.equal(skill.has(SUMMONING), false);
    });
});

test('Skill.any(trees)', () => {
    const skill = new Skill({
        name: 'Bleed Fire',
        requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
        primary_tree: PYROKINETIC,
        ap_cost: 1, sp_cost: 0,
        effect: 'test',
    });

    it('returns true when at least one tree matches', () => {
        assert.equal(skill.any(new Set([PYROKINETIC, WARFARE])), true);
    });

    it('returns false when no trees match', () => {
        assert.equal(skill.any(new Set([WARFARE, NECROMANCER])), false);
    });

    it('returns true for empty set (vacuously true — no constraint)', () => {
        assert.equal(skill.any(new Set()), true);
    });
});

test('Skill.isSummoning', () => {
    it('returns true for summoning skills', () => {
        const skill = new Skill({
            name: 'Conjure Incarnate',
            requirements: { [SUMMONING]: 1, [PYROKINETIC]: 1 },
            primary_tree: SUMMONING,
            ap_cost: 2, sp_cost: 0,
            effect: 'test',
        });
        assert.equal(skill.isSummoning, true);
    });

    it('returns false for non-summoning skills', () => {
        const skill = new Skill({
            name: 'Bleed Fire',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        });
        assert.equal(skill.isSummoning, false);
    });
});

// ── primaryTree / secondaryTree ────────────────────────

test('Skill reads primary_tree from raw data', () => {
    it('uses primary_tree field directly', () => {
        const skill = new Skill({
            name: 'Bleed Fire',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: PYROKINETIC,
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        });
        assert.equal(skill.primaryTree, PYROKINETIC);
        assert.equal(skill.secondaryTree, POLYMORPH);
    });

    it('summoning primary_tree', () => {
        const skill = new Skill({
            name: 'Fire Infusion',
            requirements: { [SUMMONING]: 1, [PYROKINETIC]: 1 },
            primary_tree: SUMMONING,
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        });
        assert.equal(skill.primaryTree, SUMMONING);
        assert.equal(skill.secondaryTree, PYROKINETIC);
    });

    it('throws when primary_tree is missing', () => {
        assert.throws(() => new Skill({
            name: 'No Primary',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        }), MissingPrimaryTreeError);
    });

    it('throws when primary_tree is not in requirements', () => {
        assert.throws(() => new Skill({
            name: 'Bad Primary',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            primary_tree: WARFARE,
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        }), InvalidPrimaryTreeError);
    });
});
