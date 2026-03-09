import Mustache from '../node_modules/mustache/mustache.mjs';

let _template = null;

async function loadTemplate() {
    if (_template) return _template;
    const resp = await fetch('./js/templates/skill-card.mustache');
    _template = await resp.text();
    return _template;
}

// For testing and SSR: set template directly
export function setTemplate(tmpl) {
    _template = tmpl;
}

export function buildViewModel(skill, category) {
    const requirements = Object.entries(skill.requirements)
        .sort(([treeA], [treeB]) => {
            if (treeA === category) return 1;
            if (treeB === category) return -1;
            return 0;
        })
        .map(([tree, level]) => ({
            tree: tree.toLowerCase(),
            label: `${tree} ${level}`,
        }));

    return {
        name: skill.name,
        nameLower: skill.name.toLowerCase(),
        treesJoined: skill.trees.join(','),
        url: skill.url,
        primaryTree: category.toLowerCase(),
        secondaryTree: skill.secondaryTree.toLowerCase(),
        apIcons: Array(skill.apCost).fill(true),
        spIcons: Array(skill.spCost).fill(true),
        hasCost: skill.apCost > 0 || skill.spCost > 0,
        effect: skill.effect,
        requirements,
        hasRequirements: requirements.length > 0,
        range: skill.range,
        cooldown: skill.cooldown,
        hasStats: !!(skill.range || skill.cooldown),
    };
}

export function createSkillCard(skill, category) {
    const vm = buildViewModel(skill, category);
    const card = document.createElement('skill-card');
    card.dataset.name = vm.nameLower;
    card.dataset.trees = vm.treesJoined;
    card.innerHTML = Mustache.render(_template, vm);
    return card;
}

export { loadTemplate };
