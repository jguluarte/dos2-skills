import Mustache from '../node_modules/mustache/mustache.mjs';
import { ViewModel } from './view-model.js';

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

class SkillCardViewModel extends ViewModel {
    constructor(skill, category) {
        super(skill);
        this._category = category;
        this.nameLower = skill.name.toLowerCase();
        this.primaryTree = category.toLowerCase();
        this.secondaryTree = skill.secondaryTree.toLowerCase();
        this.treesJoined = skill.trees.join(',');
        this.apIcons = Array(skill.apCost).fill(true);
        this.spIcons = Array(skill.spCost).fill(true);
        this.hasCost = skill.apCost > 0 || skill.spCost > 0;
        this.hasStats = !!(skill.range || skill.cooldown);
        this.hasRequirements = Object.keys(skill.requirements).length > 0;
    }

    get requirements() {
        return Object.entries(this._source.requirements)
            .sort(([treeA], [treeB]) => {
                if (treeA === this._category) return 1;
                if (treeB === this._category) return -1;
                return 0;
            })
            .map(([tree, level]) => ({
                tree: tree.toLowerCase(),
                label: `${tree} ${level}`,
            }));
    }
}

export function buildViewModel(skill, category) {
    return new SkillCardViewModel(skill, category);
}

export function createSkillCard(skill, category) {
    const vm = buildViewModel(skill, category);
    const card = document.createElement('skill-card');
    card.dataset.name = vm.nameLower;
    card.dataset.trees = vm.treesJoined;
    card.innerHTML = Mustache.render(_template, vm);
    return card;
}

export { loadTemplate, SkillCardViewModel };
