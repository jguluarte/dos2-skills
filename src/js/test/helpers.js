import { fake } from 'zod-schema-faker/v4';

import { Skill, Schema } from '@js/skill';

export function makeSkill(name, trees, overrides = {}) {
    const skill = fake(Schema);

    Object.assign(skill, {
        name,
        primary_tree: trees[0],
        secondary_tree: trees[1],
        ...overrides,
    });

    return Skill.fromYAML(skill);
}

export function set(...items) {
    return new Set(items);
}
