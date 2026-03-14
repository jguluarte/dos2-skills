import { Skill } from '../js/skill.ts';
import {
    SUMMONING, ELEMENTAL_TREES,
} from '../js/constants.ts';

export function makeSkill(name, trees) {
    const requirements = {};
    trees.forEach(t => { requirements[t] = 1; });
    const sorted = [...trees].sort();
    const [a, b] = sorted;
    let primary_tree;
    if (a === SUMMONING) primary_tree = a;
    else if (b === SUMMONING) primary_tree = b;
    else if (ELEMENTAL_TREES.includes(a)) primary_tree = a;
    else if (ELEMENTAL_TREES.includes(b)) primary_tree = b;
    else primary_tree = a;
    return new Skill({
        name, requirements, primary_tree,
        ap_cost: 1, sp_cost: 0, effect: 'test',
    });
}
