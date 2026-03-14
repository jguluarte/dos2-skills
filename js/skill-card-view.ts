import Handlebars from 'handlebars';
import type { Skill } from './skill.ts';
import mainTemplate
    from './templates/skill-card.hbs?raw';
import bodyPartial
    from './templates/skill-card-body.hbs?raw';

type CompiledTemplate =
    ReturnType<typeof Handlebars.compile>;

Handlebars.registerPartial(
    'skill-card-body', bodyPartial,
);
let _compiled: CompiledTemplate =
    Handlebars.compile(mainTemplate);

// For testing: override template and partial
export function setTemplate(
    main: string,
    body: string,
): void {
    Handlebars.registerPartial('skill-card-body', body);
    _compiled = Handlebars.compile(main);
}

export function createSkillCard(
    skill: Skill,
): Element {
    const t = document.createElement('template');
    t.innerHTML = _compiled(skill.toJSON());
    return t.content.firstElementChild!;
}
