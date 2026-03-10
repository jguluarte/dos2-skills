import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import jsyaml from 'js-yaml';
import { Skill } from '../js/skill.js';
import {
    createSkillCard, setTemplate,
} from '../js/skill-card-view.js';

const yamlPath = path.resolve(
    import.meta.dirname, '../data/skills.yaml'
);
const skills = jsyaml.load(
    fs.readFileSync(yamlPath, 'utf8')
).map(raw => new Skill(raw));

beforeAll(() => {
    const dir = path.resolve(import.meta.dirname, '../js/templates');
    const main = fs.readFileSync(
        path.join(dir, 'skill-card.hbs'), 'utf8'
    );
    const body = fs.readFileSync(
        path.join(dir, 'skill-card-body.hbs'), 'utf8'
    );
    setTemplate(main, body);
});

describe('all skills render without errors', () => {
    for (const skill of skills) {
        it(skill.name, () => {
            const card = createSkillCard(skill);

            // basic structure
            expect(
                card.tagName.toLowerCase()
            ).toBe('skill-card');
            // has required child elements
            expect(
                card.querySelector('skill-header')
            ).not.toBeNull();
            expect(
                card.querySelector('skill-name')
            ).not.toBeNull();
            expect(
                card.querySelector('skill-effect')
            ).not.toBeNull();

            // name is rendered
            const nameEl = card.querySelector('skill-name');
            expect(
                nameEl.textContent.trim()
            ).toBe(skill.name);

            // requirements rendered
            const badges = card.querySelectorAll('req-badge');
            expect(badges.length).toBe(2);

            // effect text present
            const effect = card.querySelector('skill-effect');
            expect(
                effect.textContent.trim().length
            ).toBeGreaterThan(0);
        });
    }
});
