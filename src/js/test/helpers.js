import { fake } from 'zod-schema-faker/v4';

import { Skill, Schema } from '@js/skill';

export function makeSkill(name, overrides = {}) {
    const skill = fake(Schema);
    Object.assign(skill, { name, ...overrides });
    return Skill.fromYAML(skill);
}

export function set(...items) {
    return new Set(items);
}
