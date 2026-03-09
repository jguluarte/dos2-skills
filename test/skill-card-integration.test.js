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
    const tmpl = fs.readFileSync(
        path.resolve(
            import.meta.dirname,
            '../js/templates/skill-card.mustache'
        ),
        'utf8'
    );
    setTemplate(tmpl);
});

describe('all skills render without errors', () => {
    for (const skill of skills) {
        it(skill.name, () => {
            const card = createSkillCard(
                skill, skill.primaryTree
            );

            // basic structure
            expect(
                card.tagName.toLowerCase()
            ).toBe('skill-card');
            expect(card.dataset.name).toBe(
                skill.name.toLowerCase()
            );

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
            expect(badges.length).toBe(
                Object.keys(skill.requirements).length
            );

            // effect text present
            const effect = card.querySelector('skill-effect');
            expect(
                effect.textContent.trim().length
            ).toBeGreaterThan(0);
        });
    }
});
