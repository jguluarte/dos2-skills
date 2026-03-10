import { ALL_TREES, SUMMONING } from './constants.js';
import {
    MissingNameError, MissingRequirementsError, MissingEffectError,
    UnknownTreeError, PrerequisiteError, MissingPrimaryTreeError,
    InvalidPrimaryTreeError,
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
        this.apCost = raw.ap_cost ?? 0;
        this.spCost = raw.sp_cost ?? 0;
        this.range = raw.range ?? null;
        this.cooldown = raw.cooldown ?? null;
        this.investment = Object.values(raw.requirements)[0];
        this.effect = raw.effect;
        this.url = raw.url ?? null;

        if (!raw.primary_tree) {
            throw new MissingPrimaryTreeError(raw.name);
        }
        const reqTrees = Object.keys(raw.requirements);
        if (!reqTrees.includes(raw.primary_tree)) {
            throw new InvalidPrimaryTreeError(
                raw.name, raw.primary_tree
            );
        }
        this.primaryTree = raw.primary_tree;
        this.secondaryTree = reqTrees.find(
            t => t !== raw.primary_tree
        );
        this.trees = [this.secondaryTree, this.primaryTree];
    }

    get hasCost() {
        return !!(this.apCost || this.spCost);
    }

    get hasMetadata() {
        return !!(this.range || this.cooldown);
    }

    get apIcons() {
        return Array(this.apCost).fill(true);
    }

    get spIcons() {
        return Array(this.spCost).fill(true);
    }

    get isSummoning() {
        return this.primaryTree === SUMMONING;
    }

    toJSON() {
        return {
            ...this,
            hasCost: this.hasCost,
            hasMetadata: this.hasMetadata,
            apIcons: this.apIcons,
            spIcons: this.spIcons,
        };
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
