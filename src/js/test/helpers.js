import { fake } from 'zod-schema-faker/v4';

import { Skill, Schema } from '@js/skill';

export function makeSkill(name, trees) {
    const skill = fake(Schema);

    Object.assign(skill, {
        name,
        primary_tree: trees[0],
        secondary_tree: trees[1],
    });

    return Skill.fromYAML(skill);
}
