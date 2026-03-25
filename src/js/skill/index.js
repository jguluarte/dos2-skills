export { Skill } from './skill.js';

import mainTemplate from '@templates/skill/card.hbs?raw';
import bodyPartial from '@templates/skill/body.hbs?raw';

// Handlebars is configured as a global in eslint.config.mjs
Handlebars.registerPartial('skill-card-body', bodyPartial);
const _compiled = Handlebars.compile(mainTemplate);

export function createSkillCard(skill) {
    const t = document.createElement('template');
    t.innerHTML = _compiled(skill.toJSON());
    return t.content.firstElementChild;
}
