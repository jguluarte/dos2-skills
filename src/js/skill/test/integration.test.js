import { describe, it, expect } from 'vitest';
import jsyaml from 'js-yaml';
import { Skill, createSkillCard } from '@js/skill';
import skillsYaml from '@data/skills.yaml?raw';

const skills = jsyaml.load(skillsYaml).map((raw) => new Skill(raw));

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
