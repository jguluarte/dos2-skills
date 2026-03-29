import { z } from 'zod';
import {
    ALL_TREES, NON_SUMMONING_TREES, VALID_SKILL_COMBINATION, SP_MAX, AP_MAX,
} from '@constants';

// custom schema datatype to clean up the object declaration below
function cost(max) {
    return z.int().min(0).max(max).default(0);
}

// if we have a url...it needs to match this hostname
const hostname = /divinityoriginalsin2\.wiki\.fextralife\.com/;

// these fields transform from snake (yaml) to camel (js)
const transforms = ['ap_cost', 'sp_cost', 'primary_tree', 'secondary_tree'];

export const Schema = z.object({
    name: z.string(),
    effect: z.string(),
    url: z.url({ hostname }).optional(),

    primary_tree: z.enum(ALL_TREES),
    secondary_tree: z.enum(NON_SUMMONING_TREES).optional(),
    investment: z.int().min(1).max(5),

    ap_cost: cost(AP_MAX),
    sp_cost: cost(SP_MAX),

    cooldown: z.int().min(0),
    range: z.string().regex(/^(Self|PB AoE|All allies|\d+(\.\d+)?m)$/),

}).refine((skill) => validateSkillTrees(skill), {
    error: `'primary_tree' is incompatible with 'secondary_tree'`,

}).transform((skill) => {
    // computed property
    skill.hasCost = !!(skill.ap_cost || skill.sp_cost);

    // transform names from yaml --> js
    transforms.forEach((key) => {
        skill[camelCase(key)] = skill[key];
        delete skill[key];
    });

    return skill;
});

function validateSkillTrees({ primary_tree, secondary_tree }) {
    return !!(
        !secondary_tree ||
        VALID_SKILL_COMBINATION[primary_tree].includes(secondary_tree)
    );
}

function camelCase(s) {
    return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
