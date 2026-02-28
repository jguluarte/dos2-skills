const { test, describe, it, assert } = require('./test.js');
const fs = require('fs');
const path = require('path');

const jsyaml = require('js-yaml');
const {
    VALID_SKILL_COMBINATION, SUMMONING,
} = require('../js/constants.js');

const yamlPath = path.resolve(__dirname, '../data/skills.yaml');
const yamlText = fs.readFileSync(yamlPath, 'utf8');
const skills = jsyaml.load(yamlText);

// ── aggregate checks ────────────────────────────────────

test('skills.yaml :: file format', () => {
    it('data begins as an array', () => {
        assert.ok(Array.isArray(skills), 'YAML root should be an array');
    });

    it('the array is not empty', () => {
        assert.ok(skills.length > 0, 'Should have at least one skill');
    })

    it('no duplicate skill names', () => {
        const names = skills.map(s => s.name);
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);

        assert.deepEqual(dupes, [], `Duplicates: ${dupes.join(', ')}`);
    });
});

// ── per-skill validation ────────────────────────────────

test('Skill validation', () => {
    it('no duplicate skills', () => {
        const names = skills.map(s => s.name);
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);

        assert.deepEqual(dupes, [], `Duplicates: ${dupes.join(', ')}`);
    });

    for (const skill of skills) {
        describe(skill.name, () => {
            const { name, requirements, wiki_url } = skill;
            const d = skill.ability_details;
            const prerequisites = Object.keys(requirements);

            // structure
            it('has a name', () => {
                assert.ok(name);
                assert.ok(name.length > 0);
            });

            it('has prerequisites', () => {
                assert.ok(requirements);
                assert.equal(typeof requirements, 'object');
            });

            // requirements
            // FIXME - this will change when we import all skills
            it('has exactly 2 prerequisites', () => {
                assert.equal(prerequisites.length, 2);
            });

            it('skill prerequisites are valid combinations', () => {
                // Since summoning is special...and is only considered "valid"
                // when it is a "primary skill"...we need to make sure it is
                // always the `primary` value.
                const [a, b] = prerequisites;
                const [primary, secondary] = b === SUMMONING ? [b, a] : [a, b];

                assert.ok(
                    VALID_SKILL_COMBINATION[primary].includes(secondary),
                    `Invalid combo: '${primary}' cannot find '${secondary}'`
                );
            });

            for (const [tree, level] of Object.entries(requirements)) {
                it(`prerequisite ${tree} is designated appropriately`, () => {
                    assert.ok(Number.isInteger(level));
                    assert.ok(level > 0);
                });
            }

            // ability_details
            it('ap_cost is valid', () => {
                assert.ok(Number.isInteger(d.ap_cost));
                assert.ok(d.ap_cost >= 0);
            });

            it('sp_cost is valid', () => {
                assert.ok(Number.isInteger(d.sp_cost));
                assert.ok(d.sp_cost >= 0);
            });

            // Cooldown can be undefined for a handful of skills
            if (d.cooldown !== undefined) {
                it('cooldown is a valid number', () => {
                    assert.ok(Number.isInteger(d.cooldown));
                    assert.ok(d.cooldown >= 0);
                });
            } else {
                it('cooldown is appropriately undefined', () => {
                    assert.equal(d.cooldown, undefined);
                });
            }

            it('range is valid', () => {
                assert.match(d.range, /^(Self|PB AoE|All allies|\d+m)$/);
            });

            it('has ability text', () => {
                assert.ok(d.effect.trim().length > 0);
            });

            if (wiki_url) {
                it('wiki_url is a valid URL', () => {
                    assert.doesNotThrow(() => new URL(wiki_url));
                });
            } else {
                it('wiki_url is appropriately undefined', () => {
                    assert.equal(d.wiki_url, undefined);
                });
            }
        });
    }
});
