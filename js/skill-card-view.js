/* global Handlebars */

let _compiled = null;

async function loadTemplate() {
    if (_compiled) return _compiled;
    const [mainResp, bodyResp] = await Promise.all([
        fetch('./js/templates/skill-card.hbs'),
        fetch('./js/templates/skill-card-body.hbs'),
    ]);
    Handlebars.registerPartial(
        'skill-card-body', await bodyResp.text()
    );
    _compiled = Handlebars.compile(await mainResp.text());
    return _compiled;
}

// For testing and SSR: set template and partial directly
export function setTemplate(main, body) {
    Handlebars.registerPartial('skill-card-body', body);
    _compiled = Handlebars.compile(main);
}

export function createSkillCard(skill) {
    const t = document.createElement('template');
    t.innerHTML = _compiled(skill.toJSON());
    return t.content.firstElementChild;
}

export { loadTemplate };
