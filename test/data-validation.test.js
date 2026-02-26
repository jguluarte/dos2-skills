const { test, describe, it, assert } = require('./test.js');
const fs = require('fs');
const path = require('path');

const jsyaml = require('js-yaml');
const {
    ALL_TREES, ELEMENTAL_TREES, SUMMONING, NECROMANCER,
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

const validSummonPairs = [...ELEMENTAL_TREES, NECROMANCER];

test('Skill validation', () => {
    it('no skill is found twice', () => {
        const names = skills.map(s => s.name);
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);

        assert.deepEqual(dupes, [], `Duplicates: ${dupes.join(', ')}`);
    });

    for (const skill of skills) {
        describe(skill.name, () => {
            const { name, requirements, wiki_url } = skill;
            const d = skill.ability_details;
            const trees = Object.keys(requirements);

            // structure
            it('has a name', () => {
                assert.ok(name);
                assert.equal(typeof name, 'string');
            });

            it('has requirements', () => {
                assert.ok(requirements);
                assert.equal(typeof requirements, 'object');
            });

            // requirements
            it('has exactly 2 trees', () => {
                assert.equal(trees.length, 2);
            });

            for (const tree of trees) {
                it(`tree "${tree}" is valid`, () => {
                    assert.ok(ALL_TREES.includes(tree));
                });
            }

            it('trees are different', () => {
                assert.notEqual(trees[0], trees[1]);
            });

            for (const [tree, level] of Object.entries(requirements)) {
                it(`${tree} level is a positive integer`, () => {
                    assert.ok(
                        Number.isInteger(level) && level > 0);
                });
            }

            // pairing rules
            const eleCount = trees.filter(
                t => ELEMENTAL_TREES.includes(t)).length;

            it('does not pair two elementals', () => {
                assert.ok(eleCount <= 1);
            });

            if (trees.includes(SUMMONING)) {
                const other = trees.find(t => t !== SUMMONING);
                it('Summoning pairs with valid tree', () => {
                    assert.ok(validSummonPairs.includes(other));
                });
            } else {
                it('has at least one elemental tree', () => {
                    assert.ok(eleCount >= 1);
                });
            }

            // ability_details
            if (d) {
                if (d.ap_cost !== undefined) {
                    it('ap_cost is valid', () => {
                        assert.ok(
                            Number.isInteger(d.ap_cost)
                            && d.ap_cost >= 0);
                    });
                }
                if (d.sp_cost !== undefined) {
                    it('sp_cost is valid', () => {
                        assert.ok(
                            Number.isInteger(d.sp_cost)
                            && d.sp_cost >= 0);
                    });
                }
                if (d.cooldown !== undefined) {
                    it('cooldown is valid', () => {
                        assert.ok(
                            Number.isInteger(d.cooldown)
                            && d.cooldown >= 0);
                    });
                }
                if (d.range !== undefined) {
                    it('range is a string or number', () => {
                        const type = typeof d.range;
                        assert.ok(
                            type === 'string'
                            || type === 'number');
                    });
                }
                if (d.effect !== undefined) {
                    it('effect is a non-empty string', () => {
                        assert.equal(typeof d.effect, 'string');
                        assert.ok(d.effect.trim().length > 0);
                    });
                }
            }

            if (wiki_url) {
                it('wiki_url is valid HTTPS', () => {
                    assert.ok(
                        wiki_url.startsWith('https://'));
                    assert.doesNotThrow(
                        () => new URL(wiki_url));
                });
            }
        });
    }
});
