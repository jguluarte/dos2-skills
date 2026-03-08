const { test, it, assert } = require('./test.js');

const { Skill } = require('../js/skill.js');

// ── construction & properties ───────────────────────────

test('Skill construction', () => {
    const raw = {
        name: 'Bleed Fire',
        requirements: { Pyrokinetic: 1, Polymorph: 1 },
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
        assert.deepEqual(skill.trees, ['Polymorph', 'Pyrokinetic']);
    });

    it('exposes requirements map', () => {
        assert.deepEqual(skill.requirements, { Pyrokinetic: 1, Polymorph: 1 });
    });

    it('exposes ap_cost', () => {
        assert.equal(skill.apCost, 1);
    });

    it('exposes sp_cost', () => {
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
        requirements: { Warfare: 2, Geomancer: 1 },
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

// ── filter methods ──────────────────────────────────────

test('Skill.has(tree)', () => {
    const skill = new Skill({
        name: 'Bleed Fire',
        requirements: { Pyrokinetic: 1, Polymorph: 1 },
        ap_cost: 1, sp_cost: 0,
        effect: 'test',
    });

    it('returns true for a tree the skill requires', () => {
        assert.equal(skill.has('Pyrokinetic'), true);
        assert.equal(skill.has('Polymorph'), true);
    });

    it('returns false for a tree the skill does not require', () => {
        assert.equal(skill.has('Warfare'), false);
        assert.equal(skill.has('Summoning'), false);
    });
});

test('Skill.any(trees)', () => {
    const skill = new Skill({
        name: 'Bleed Fire',
        requirements: { Pyrokinetic: 1, Polymorph: 1 },
        ap_cost: 1, sp_cost: 0,
        effect: 'test',
    });

    it('returns true when at least one tree matches', () => {
        assert.equal(skill.any(new Set(['Pyrokinetic', 'Warfare'])), true);
    });

    it('returns false when no trees match', () => {
        assert.equal(skill.any(new Set(['Warfare', 'Necromancer'])), false);
    });

    it('returns true for empty set (vacuously true — no constraint)', () => {
        assert.equal(skill.any(new Set()), true);
    });
});

test('Skill.isSummoning', () => {
    it('returns true for summoning skills', () => {
        const skill = new Skill({
            name: 'Conjure Incarnate',
            requirements: { Summoning: 1, Pyrokinetic: 1 },
            ap_cost: 2, sp_cost: 0,
            effect: 'test',
        });
        assert.equal(skill.isSummoning, true);
    });

    it('returns false for non-summoning skills', () => {
        const skill = new Skill({
            name: 'Bleed Fire',
            requirements: { Pyrokinetic: 1, Polymorph: 1 },
            ap_cost: 1, sp_cost: 0,
            effect: 'test',
        });
        assert.equal(skill.isSummoning, false);
    });
});
