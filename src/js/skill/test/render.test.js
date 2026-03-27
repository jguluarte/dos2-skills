import { fake } from 'zod-schema-faker/v4';
import { describe, it, expect, beforeEach } from 'vitest';

import { Skill, Schema as SkillSchema, createSkillCard } from '@js/skill';
import { PYROKINETIC, POLYMORPH } from '@constants';

function renderCard(yaml) {
    return createSkillCard(Skill.fromYAML(yaml));
}

describe('createSkillCard', () => {
    let skill, card;
    beforeEach(() => {
        skill = fake(SkillSchema);
        skill.primary_tree = PYROKINETIC;
        skill.secondary_tree = POLYMORPH;

        card = renderCard(skill);
    });

    it('returns a skill-card element', () => {
        expect(card.tagName.toLowerCase()).toBe('skill-card');
    });

    it('sets data-trees', () => {
        expect(card.dataset.trees).toBe(
            [skill.secondary_tree, skill.primary_tree].join(',')
        );
    });

    it('sets data-primary-tree', () => {
        expect(card.dataset.primaryTree).toBe(
            skill.primary_tree.toLowerCase()
        );
    });

    it('sets data-secondary-tree', () => {
        expect(card.dataset.secondaryTree).toBe(
            skill.secondary_tree.toLowerCase()
        );
    });

    it('renders skill description', () => {
        const effect = card.querySelector('skill-effect');
        expect(effect.textContent.trim()).toBe(skill.effect);
    });

    it('renders range', () => {
        const range = card.querySelector('skill-range');
        expect(range.textContent).toBe(skill.range);
    });

    it('renders cooldown', () => {
        const cooldown = card.querySelector('skill-cooldown');
        expect(cooldown.textContent).toBe(String(skill.cooldown));
    });

    it('renders tree badges in order', () => {
        const badges = card.querySelectorAll('req-badge');
        const [first, second] = [...badges].map((b) => b.dataset.tree);

        expect(first).toBe(skill.secondary_tree.toLowerCase());
        expect(second).toBe(skill.primary_tree.toLowerCase());
    });
});

describe('skill card variations', () => {
    const test_url = 'https://divinityoriginalsin2.wiki.fextralife.com/Test/';
    let skill;
    beforeEach(() => {
        skill = fake(SkillSchema);
        skill.primary_tree = PYROKINETIC;
        skill.secondary_tree = POLYMORPH;
    });

    it('renders name as a link when url is present', () => {
        skill.url = test_url;
        const card = renderCard(skill);
        const link = card.querySelector('skill-name a');

        // Make sure we have a link, with the expected url that maches the name
        expect(link).not.toBeNull();
        expect(link.href).toBe(test_url);
        expect(link.textContent.trim()).toBe(skill.name);

        // make sure there is NOT a span
        expect(card.querySelector('skill-name span')).toBeNull();
    });

    it('renders name as a span when no url', () => {
        delete skill.url;
        const card = renderCard(skill);
        const span = card.querySelector('skill-name span');

        // similarly, we should have a span with the name
        expect(span).not.toBeNull();
        expect(span.textContent.trim()).toBe(skill.name);

        // and no link
        expect(card.querySelector('skill-name a')).toBeNull();
    });

    it('renders AP icons', () => {
        skill.ap_cost = 2;
        const card = renderCard(skill);
        const icons = card.querySelectorAll('ap-icon');

        expect(icons.length).toBe(skill.ap_cost);
        expect(card.querySelector('skill-cost')).not.toBeNull();
    });

    it('renders SP icons', () => {
        skill.sp_cost = 2;
        const card = renderCard(skill);
        const icons = card.querySelectorAll('source-icon');

        expect(icons.length).toBe(skill.sp_cost);
        expect(card.querySelector('skill-cost')).not.toBeNull();
    });

    it('omits skill-cost when both are 0', () => {
        skill.sp_cost = skill.ap_cost = 0;
        const card = renderCard(skill);

        // we shouldn't have this field at all without any costs!
        expect(card.querySelector('skill-cost')).toBeNull();
    });
});
