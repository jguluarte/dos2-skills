/**
 * Tests that validate the actual skills.yaml data file.
 *
 * These catch data entry errors: typos in tree names, missing fields,
 * invalid requirement combos, etc. Run these after editing skills.yaml
 * to make sure nothing is broken.
 */
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const jsyaml = require('js-yaml');
const { ALL_TREES, ELEMENTAL_TREES, SUMMONING, NECROMANCER } = require('../js/constants.js');

let skills;

before(() => {
  const yamlPath = path.resolve(__dirname, '../data/skills.yaml');
  const yamlText = fs.readFileSync(yamlPath, 'utf8');
  skills = jsyaml.load(yamlText);
});

// ── basic structure ──────────────────────────────────────

describe('skills.yaml - structure', () => {
  it('is a non-empty array', () => {
    assert.ok(Array.isArray(skills), 'YAML root should be an array');
    assert.ok(skills.length > 0, 'Should have at least one skill');
  });

  it('every skill has a name', () => {
    for (const skill of skills) {
      assert.ok(skill.name, `Skill is missing a name: ${JSON.stringify(skill)}`);
      assert.equal(typeof skill.name, 'string');
    }
  });

  it('every skill has requirements', () => {
    for (const skill of skills) {
      assert.ok(skill.requirements, `"${skill.name}" is missing requirements`);
      assert.equal(typeof skill.requirements, 'object');
    }
  });

  it('no duplicate skill names', () => {
    const names = skills.map(s => s.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    assert.deepEqual(dupes, [], `Duplicate skill names found: ${dupes.join(', ')}`);
  });
});

// ── requirements validation ──────────────────────────────

describe('skills.yaml - requirements', () => {
  it('every requirement tree name is a valid tree', () => {
    for (const skill of skills) {
      for (const tree of Object.keys(skill.requirements)) {
        assert.ok(ALL_TREES.includes(tree),
          `"${skill.name}" has invalid tree "${tree}". Valid: ${ALL_TREES.join(', ')}`);
      }
    }
  });

  it('every skill has exactly 2 requirement trees', () => {
    for (const skill of skills) {
      const count = Object.keys(skill.requirements).length;
      assert.equal(count, 2,
        `"${skill.name}" has ${count} requirement trees, expected 2`);
    }
  });

  it('requirement levels are positive integers', () => {
    for (const skill of skills) {
      for (const [tree, level] of Object.entries(skill.requirements)) {
        assert.ok(Number.isInteger(level) && level > 0,
          `"${skill.name}" has invalid level ${level} for ${tree}`);
      }
    }
  });

  it('both requirement trees in a skill are different', () => {
    for (const skill of skills) {
      const trees = Object.keys(skill.requirements);
      assert.notEqual(trees[0], trees[1],
        `"${skill.name}" has the same tree twice: ${trees[0]}`);
    }
  });
});

// ── pairing rules (game rules validation) ────────────────

describe('skills.yaml - pairing rules', () => {
  it('no skill pairs two elemental trees', () => {
    for (const skill of skills) {
      const trees = Object.keys(skill.requirements);
      const elementalCount = trees.filter(t => ELEMENTAL_TREES.includes(t)).length;
      assert.ok(elementalCount <= 1,
        `"${skill.name}" pairs two elemental trees: ${trees.join(' + ')}`);
    }
  });

  it('Summoning skills pair only with elemental or Necromancer', () => {
    const validSummoningPairs = [...ELEMENTAL_TREES, NECROMANCER];
    for (const skill of skills) {
      const trees = Object.keys(skill.requirements);
      if (trees.includes(SUMMONING)) {
        const other = trees.find(t => t !== SUMMONING);
        assert.ok(validSummoningPairs.includes(other),
          `"${skill.name}" pairs Summoning with invalid tree "${other}"`);
      }
    }
  });

  it('every non-Summoning skill has at least one elemental tree', () => {
    for (const skill of skills) {
      const trees = Object.keys(skill.requirements);
      if (!trees.includes(SUMMONING)) {
        const hasElemental = trees.some(t => ELEMENTAL_TREES.includes(t));
        assert.ok(hasElemental,
          `"${skill.name}" (${trees.join(' + ')}) has no elemental tree`);
      }
    }
  });
});

// ── ability_details validation ───────────────────────────

describe('skills.yaml - ability_details', () => {
  it('ap_cost is a non-negative integer when present', () => {
    for (const skill of skills) {
      if (skill.ability_details?.ap_cost !== undefined) {
        const cost = skill.ability_details.ap_cost;
        assert.ok(Number.isInteger(cost) && cost >= 0,
          `"${skill.name}" has invalid ap_cost: ${cost}`);
      }
    }
  });

  it('sp_cost is a non-negative integer when present', () => {
    for (const skill of skills) {
      if (skill.ability_details?.sp_cost !== undefined) {
        const cost = skill.ability_details.sp_cost;
        assert.ok(Number.isInteger(cost) && cost >= 0,
          `"${skill.name}" has invalid sp_cost: ${cost}`);
      }
    }
  });

  it('cooldown is a non-negative integer when present', () => {
    for (const skill of skills) {
      if (skill.ability_details?.cooldown !== undefined) {
        const cd = skill.ability_details.cooldown;
        assert.ok(Number.isInteger(cd) && cd >= 0,
          `"${skill.name}" has invalid cooldown: ${cd}`);
      }
    }
  });

  it('range is a string or number when present', () => {
    for (const skill of skills) {
      if (skill.ability_details?.range !== undefined) {
        assert.ok(typeof skill.ability_details.range === 'string' ||
                  typeof skill.ability_details.range === 'number',
          `"${skill.name}" has invalid range type`);
      }
    }
  });

  it('effect is a non-empty string when present', () => {
    for (const skill of skills) {
      if (skill.ability_details?.effect !== undefined) {
        assert.ok(typeof skill.ability_details.effect === 'string',
          `"${skill.name}" has non-string effect`);
        assert.ok(skill.ability_details.effect.trim().length > 0,
          `"${skill.name}" has empty effect`);
      }
    }
  });

  it('wiki_url is a valid URL when present', () => {
    for (const skill of skills) {
      if (skill.wiki_url) {
        assert.ok(skill.wiki_url.startsWith('https://'),
          `"${skill.name}" has non-HTTPS wiki_url: ${skill.wiki_url}`);
        // Verify it parses as a URL
        assert.doesNotThrow(() => new URL(skill.wiki_url),
          `"${skill.name}" has invalid wiki_url: ${skill.wiki_url}`);
      }
    }
  });
});
