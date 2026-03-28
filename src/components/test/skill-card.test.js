import { fake } from 'zod-schema-faker/v4';
import { describe, it, expect, beforeEach } from 'vitest';

import SkillCard from '../SkillCard.svelte';
import { render } from '@testing-library/svelte';

import { PYROKINETIC, POLYMORPH } from '@constants';
import { Skill, Schema as SkillSchema } from '@js/skill';

function renderCard(yaml) {
    const skill = Skill.fromYAML(yaml);
    const { container } = render(SkillCard, { props: { skill } });
    return container.querySelector('skill-card');
}

describe('SkillCard', () => {
    let skill, card;
    beforeEach(() => {
        skill = fake(SkillSchema);
        skill.primary_tree = PYROKINETIC;
        skill.secondary_tree = POLYMORPH;

        card = renderCard(skill);
    });

    it('renders a skill-card element', () => {
        expect(card.tagName.toLowerCase()).toBe('skill-card');
    });

    it('sets data-primary-tree', () => {
        expect(card.dataset.primaryTree).toBe(PYROKINETIC);
    });

    it('sets data-secondary-tree', () => {
        expect(card.dataset.secondaryTree).toBe(POLYMORPH);
    });

    it('renders skill effect', () => {
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
        const trees = [...badges].map((b) => b.dataset.tree);

        expect(trees).toEqual([POLYMORPH, PYROKINETIC]);
    });
});

describe('SkillCard variations', () => {
    const testUrl = 'https://divinityoriginalsin2.wiki.fextralife.com/Test/';
    let skill;
    beforeEach(() => {
        skill = fake(SkillSchema);
        skill.primary_tree = PYROKINETIC;
        skill.secondary_tree = POLYMORPH;
    });

    it('renders name as a link when url is present', () => {
        skill.url = testUrl;
        const card = renderCard(skill);
        const link = card.querySelector('skill-name a');

        expect(link).not.toBeNull();
        expect(link.href).toBe(testUrl);
        expect(link.textContent.trim()).toBe(skill.name);
        expect(card.querySelector('skill-name span')).toBeNull();
    });

    it('renders name as a span when no url', () => {
        delete skill.url;
        const card = renderCard(skill);
        const span = card.querySelector('skill-name span');

        expect(span).not.toBeNull();
        expect(span.textContent.trim()).toBe(skill.name);
        expect(card.querySelector('skill-name a')).toBeNull();
    });

    it('renders AP icons', () => {
        skill.ap_cost = 2;
        const card = renderCard(skill);

        expect(card.querySelectorAll('ap-icon').length).toBe(2);
        expect(card.querySelector('skill-cost')).not.toBeNull();
    });

    it('renders SP icons', () => {
        skill.sp_cost = 2;
        const card = renderCard(skill);

        expect(card.querySelectorAll('source-icon').length).toBe(2);
        expect(card.querySelector('skill-cost')).not.toBeNull();
    });

    it('omits skill-cost when both are 0', () => {
        skill.sp_cost = skill.ap_cost = 0;
        const card = renderCard(skill);

        expect(card.querySelector('skill-cost')).toBeNull();
    });
});
