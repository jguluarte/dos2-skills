import Mustache from '../node_modules/mustache/mustache.mjs';
import { viewModel } from './view-model.js';

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
    return viewModel(skill, {
        nameLower: s => s.name.toLowerCase(),
        primaryTree: () => category.toLowerCase(),
        secondaryTree: s => s.secondaryTree.toLowerCase(),
        treesJoined: s => s.trees.join(','),
        apIcons: s => Array(s.apCost).fill(true),
        spIcons: s => Array(s.spCost).fill(true),
        hasCost: s => s.apCost > 0 || s.spCost > 0,
        hasStats: s => !!(s.range || s.cooldown),
        requirements: s => {
            return Object.entries(s.requirements)
                .sort(([treeA], [treeB]) => {
                    if (treeA === category) return 1;
                    if (treeB === category) return -1;
                    return 0;
                })
                .map(([tree, level]) => ({
                    tree: tree.toLowerCase(),
                    label: `${tree} ${level}`,
                }));
        },
        hasRequirements: s => {
            return Object.keys(s.requirements).length > 0;
        },
    });
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
