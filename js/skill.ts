import type { TreeName } from './constants.ts';
import { ALL_TREES, SUMMONING } from './constants.ts';
import {
    MissingNameError,
    MissingRequirementsError,
    MissingEffectError,
    UnknownTreeError,
    PrerequisiteError,
    MissingPrimaryTreeError,
    InvalidPrimaryTreeError,
} from './errors.ts';

export interface RawSkill {
    name?: string;
    requirements?: Record<string, number>;
    primary_tree?: string;
    ap_cost?: number;
    sp_cost?: number;
    range?: string;
    cooldown?: number;
    effect?: string;
    url?: string;
}

export interface SkillJSON {
    name: string;
    apCost: number;
    spCost: number;
    range: string | null;
    cooldown: number | null;
    investment: number;
    effect: string;
    url: string | null;
    primaryTree: TreeName;
    secondaryTree: TreeName;
    trees: [TreeName, TreeName];
    hasCost: boolean;
    hasMetadata: boolean;
    apIcons: boolean[];
    spIcons: boolean[];
}

export class Skill {
    readonly name: string;
    readonly apCost: number;
    readonly spCost: number;
    readonly range: string | null;
    readonly cooldown: number | null;
    readonly investment: number;
    readonly effect: string;
    readonly url: string | null;
    readonly primaryTree: TreeName;
    readonly secondaryTree: TreeName;
    readonly trees: [TreeName, TreeName];

    constructor(raw: RawSkill) {
        if (!raw.name) {
            throw new MissingNameError();
        }
        if (
            !raw.requirements
            || Object.keys(raw.requirements).length === 0
        ) {
            throw new MissingRequirementsError(raw.name);
        }
        if (!raw.effect) {
            throw new MissingEffectError(raw.name);
        }

        for (
            const [tree, level]
            of Object.entries(raw.requirements)
        ) {
            if (!ALL_TREES.includes(tree as TreeName)) {
                throw new UnknownTreeError(
                    raw.name, tree,
                );
            }
            if (
                !Number.isInteger(level) || level < 1
            ) {
                throw new PrerequisiteError(
                    raw.name, tree, level,
                );
            }
        }

        this.name = raw.name;
        this.apCost = raw.ap_cost ?? 0;
        this.spCost = raw.sp_cost ?? 0;
        this.range = raw.range ?? null;
        this.cooldown = raw.cooldown ?? null;
        this.investment =
            Object.values(raw.requirements)[0];
        this.effect = raw.effect;
        this.url = raw.url ?? null;

        if (!raw.primary_tree) {
            throw new MissingPrimaryTreeError(raw.name);
        }
        const reqTrees = Object.keys(raw.requirements);
        if (!reqTrees.includes(raw.primary_tree)) {
            throw new InvalidPrimaryTreeError(
                raw.name, raw.primary_tree,
            );
        }
        this.primaryTree = raw.primary_tree as TreeName;
        this.secondaryTree = reqTrees.find(
            t => t !== raw.primary_tree,
        )! as TreeName;
        this.trees = [
            this.secondaryTree, this.primaryTree,
        ];
    }

    get hasCost(): boolean {
        return !!(this.apCost || this.spCost);
    }

    get hasMetadata(): boolean {
        return !!(this.range || this.cooldown);
    }

    get apIcons(): boolean[] {
        return Array(this.apCost).fill(true) as boolean[];
    }

    get spIcons(): boolean[] {
        return Array(this.spCost).fill(true) as boolean[];
    }

    get isSummoning(): boolean {
        return this.primaryTree === SUMMONING;
    }

    toJSON(): SkillJSON {
        return {
            ...this,
            hasCost: this.hasCost,
            hasMetadata: this.hasMetadata,
            apIcons: this.apIcons,
            spIcons: this.spIcons,
        };
    }

    has(tree: TreeName): boolean {
        return this.trees.includes(tree);
    }

    // FIXME: Refactor out when building SkillCatalog --
    // filter-matching logic belongs on the catalog,
    // not here
    any(trees: Set<TreeName>): boolean {
        if (trees.size === 0) return true;
        return this.trees.some(t => trees.has(t));
    }
}
