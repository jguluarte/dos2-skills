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
