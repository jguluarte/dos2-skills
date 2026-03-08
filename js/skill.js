import { ALL_TREES, ELEMENTAL_TREES, SUMMONING } from './constants.js';
import {
    MissingNameError, MissingRequirementsError, MissingEffectError,
    UnknownTreeError, PrerequisiteError,
} from './errors.js';

export class Skill {
    constructor(raw) {
        if (!raw.name) {
            throw new MissingNameError();
        }
        if (!raw.requirements || Object.keys(raw.requirements).length === 0) {
            throw new MissingRequirementsError(raw.name);
        }
        if (!raw.effect) {
            throw new MissingEffectError(raw.name);
        }

        for (const [tree, level] of Object.entries(raw.requirements)) {
            if (!ALL_TREES.includes(tree)) {
                throw new UnknownTreeError(raw.name, tree);
            }
            if (!Number.isInteger(level) || level < 1) {
                throw new PrerequisiteError(raw.name, tree, level);
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
        this.url = raw.wiki_url ?? null;

        // TODO: Once YAML includes primary_tree, read it directly
        // instead of computing it here.
        const { primary, secondary } = this.#classifyTrees();
        this.primaryTree = primary;
        this.secondaryTree = secondary;
    }

    #classifyTrees() {
        const [a, b] = this.trees;

        if (a === SUMMONING) return { primary: a, secondary: b };
        if (b === SUMMONING) return { primary: b, secondary: a };

        if (ELEMENTAL_TREES.includes(a)) return { primary: a, secondary: b };
        if (ELEMENTAL_TREES.includes(b)) return { primary: b, secondary: a };

        return { primary: a, secondary: b };
    }

    get isSummoning() {
        return this.primaryTree === SUMMONING;
    }

    has(tree) {
        return this.trees.includes(tree);
    }

    // FIXME: Refactor out when building SkillCatalog —
    // filter-matching logic belongs on the catalog, not here
    any(trees) {
        if (trees.size === 0) return true;
        return this.trees.some(t => trees.has(t));
    }

}
