const { test, it, assert } = require('./test.js');

const { Skill } = require('../js/skill.js');
const {
    SUMMONING, PYROKINETIC, POLYMORPH, WARFARE, NECROMANCER, GEOMANCER,
} = require('../js/constants.js');

// ── construction & properties ───────────────────────────

test('Skill construction', () => {
    const raw = {
        name: 'Bleed Fire',
        requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
        wiki_url: 'https://example.com/bleed-fire',
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

    it('exposes wikiUrl', () => {
        assert.equal(skill.wikiUrl, 'https://example.com/bleed-fire');
    });
});

test('Skill construction with missing optional fields', () => {
    const raw = {
        name: 'Minimal Skill',
        requirements: { [WARFARE]: 2, [GEOMANCER]: 1 },
        ap_cost: 2,
        sp_cost: 1,
        effect: 'Does something.',
    };
    const skill = new Skill(raw);

    it('wikiUrl defaults to null', () => {
        assert.equal(skill.wikiUrl, null);
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
    it('throws when name is missing', () => {
        assert.throws(() => new Skill({
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            effect: 'test',
        }), /name/i);
    });

    it('throws when requirements is missing', () => {
        assert.throws(() => new Skill({
            name: 'Bad Skill',
            effect: 'test',
        }), /requirements/i);
    });

    it('throws when requirements is empty', () => {
        assert.throws(() => new Skill({
            name: 'Bad Skill',
            requirements: {},
            effect: 'test',
        }), /requirements/i);
    });

    it('throws when effect is missing', () => {
        assert.throws(() => new Skill({
            name: 'Bad Skill',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
        }), /effect/i);
    });

    it('throws when a requirement tree name is invalid', () => {
        assert.throws(() => new Skill({
            name: 'Bad Skill',
            requirements: { FakeTree: 1, [PYROKINETIC]: 1 },
            effect: 'test',
        }), /tree.*FakeTree/i);
    });

    it('throws when a requirement level is not a positive integer', () => {
        assert.throws(() => new Skill({
            name: 'Bad Skill',
            requirements: { [PYROKINETIC]: 0, [POLYMORPH]: 1 },
            effect: 'test',
        }), /level/i);
    });
});

// ── filter methods ──────────────────────────────────────

test('Skill.has(tree)', () => {
    const skill = new Skill({
        name: 'Bleed Fire',
        requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
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
            ap_cost: 2, sp_cost: 0,
            effect: 'test',
        });
        assert.equal(skill.isSummoning, true);
    });

    it('returns false for non-summoning skills', () => {
        const skill = new Skill({
            name: 'Bleed Fire',
            requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 1 },
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        });
        assert.equal(skill.isSummoning, false);
    });
});

