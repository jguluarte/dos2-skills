export class Skill {
    constructor(raw) {
        this.name = raw.name;
        this.requirements = raw.requirements;
        this.trees = Object.keys(raw.requirements).sort();
        this.apCost = raw.ap_cost;
        this.spCost = raw.sp_cost;
        this.range = raw.range ?? null;
        this.cooldown = raw.cooldown ?? null;
        this.effect = raw.effect;
        this.wikiUrl = raw.wiki_url ?? null;
    }

    get isSummoning() {
        return this.trees.includes('Summoning');
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
