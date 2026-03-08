const { Skill } = require('../js/skill.js');

function rawSkill(name, trees) {
    const requirements = {};
    trees.forEach(t => { requirements[t] = 1; });
    return {
        name, requirements,
        ap_cost: 1, sp_cost: 0, effect: '',
    };
}

function skill(name, trees) {
    return new Skill(rawSkill(name, trees));
}

module.exports = { skill, rawSkill };
