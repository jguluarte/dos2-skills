const { Skill } = require('../js/skill.js');

function buildRawSkill(name, trees) {
    const requirements = {};
    trees.forEach(t => { requirements[t] = 1; });
    return {
        name, requirements,
        ap_cost: 1, sp_cost: 0, effect: 'test',
    };
}

function makeSkill(name, trees) {
    return new Skill(buildRawSkill(name, trees));
}

module.exports = { makeSkill, buildRawSkill };
