import { ALL_TREES, SUMMONING } from './constants.js';

export class Skill {
    constructor(raw) {
        if (!raw.name) {
            throw new Error('Skill requires a name');
        }
        if (!raw.requirements || Object.keys(raw.requirements).length === 0) {
            throw new Error(
                `Skill "${raw.name}" requires non-empty requirements`
            );
        }
        if (!raw.effect) {
            throw new Error(`Skill "${raw.name}" requires an effect`);
        }

        for (const [tree, level] of Object.entries(raw.requirements)) {
            if (!ALL_TREES.includes(tree)) {
                throw new Error(
                    `Skill "${raw.name}": invalid tree "${tree}"`
                );
            }
            if (!Number.isInteger(level) || level < 1) {
                throw new Error(
                    `Skill "${raw.name}": level must be a positive integer`
                );
            }
        }

        this.name = raw.name;
        this.requirements = raw.requirements;
        this.trees = Object.keys(raw.requirements).sort();
        this.apCost = raw.ap_cost ?? 0;
        this.spCost = raw.sp_cost ?? 0;
        this.range = raw.range ?? null;
        this.cooldown = raw.cooldown ?? null;
        this.effect = raw.effect;
        this.wikiUrl = raw.wiki_url ?? null;
    }

    get isSummoning() {
        return this.trees.includes(SUMMONING);
    }

    has(tree) {
        return this.trees.includes(tree);
    }

    any(trees) {
        if (trees.size === 0) return true;
        return this.trees.some(t => trees.has(t));
    }

    secondaryTree(category) {
        if (!this.trees.includes(category)) return null;
        return this.trees.find(t => t !== category) ?? null;
    }
}
