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
    }

    get nameLower() {
        return this._source.name.toLowerCase();
    }

    get primaryTree() {
        return this._category.toLowerCase();
    }

    get secondaryTree() {
        return this._source.secondaryTree.toLowerCase();
    }

    get treesJoined() {
        return this._source.trees.join(',');
    }

    get apIcons() {
        return Array(this._source.apCost).fill(true);
    }

    get spIcons() {
        return Array(this._source.spCost).fill(true);
    }

    get hasCost() {
        return this._source.apCost > 0 || this._source.spCost > 0;
    }

    get hasStats() {
        return !!(this._source.range || this._source.cooldown);
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

    get hasRequirements() {
        return Object.keys(this._source.requirements).length > 0;
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
