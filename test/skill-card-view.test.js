import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Skill } from '../js/skill.js';
import { createSkillCard, setTemplate } from '../js/skill-card-view.js';
import {
    PYROKINETIC, POLYMORPH, WARFARE,
} from '../js/constants.js';

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

// ── fixtures ────────────────────────────────────────────

const bleedFire = new Skill({
    name: 'Bleed Fire',
    requirements: { [PYROKINETIC]: 1, [POLYMORPH]: 2 },
    primary_tree: PYROKINETIC,
    url: 'https://example.com/bleed-fire',
    ap_cost: 1,
    sp_cost: 1,
    range: '13m',
    cooldown: 3,
    effect: 'Enemies bleed fire when hit.',
});

const minimalSkill = new Skill({
    name: 'Minimal Skill',
    requirements: { [WARFARE]: 2, [PYROKINETIC]: 1 },
    primary_tree: PYROKINETIC,
    effect: 'Does something.',
});

// ── createSkillCard (DOM output) ────────────────────────

describe('createSkillCard', () => {
    it('returns a skill-card element', () => {
        const card = createSkillCard(bleedFire);
        expect(card.tagName.toLowerCase()).toBe('skill-card');
    });

    it('sets data-trees to comma-separated trees', () => {
        const card = createSkillCard(bleedFire);
        expect(card.dataset.trees).toBe(
            bleedFire.trees.join(',')
        );
    });
});

describe('skill name rendering', () => {
    it('renders name as a link when url is present', () => {
        const card = createSkillCard(bleedFire);
        const link = card.querySelector('skill-name a');
        expect(link).not.toBeNull();
        expect(link.href).toBe(bleedFire.url);
        expect(link.textContent.trim()).toBe(bleedFire.name);
    });

    it('renders name as a span when no url', () => {
        const card = createSkillCard(minimalSkill);
        const span = card.querySelector('skill-name span');
        expect(span).not.toBeNull();
        expect(span.textContent.trim()).toBe(minimalSkill.name);
        expect(card.querySelector('skill-name a')).toBeNull();
    });

    it('sets data-primary-tree on skill-card', () => {
        const card = createSkillCard(bleedFire);
        expect(card.dataset.primaryTree).toBe(
            bleedFire.primaryTree.toLowerCase()
        );
    });

    it('sets data-secondary-tree on skill-card', () => {
        const card = createSkillCard(bleedFire);
        expect(card.dataset.secondaryTree).toBe(
            bleedFire.secondaryTree.toLowerCase()
        );
    });
});

describe('cost rendering', () => {
    it('renders AP icons', () => {
        const card = createSkillCard(bleedFire);
        const apIcons = card.querySelectorAll('ap-icon');
        expect(apIcons.length).toBe(bleedFire.apCost);
    });

    it('renders SP icons', () => {
        const card = createSkillCard(bleedFire);
        const spIcons = card.querySelectorAll('source-icon');
        expect(spIcons.length).toBe(bleedFire.spCost);
    });

    it('omits skill-cost when both are 0', () => {
        const card = createSkillCard(minimalSkill);
        expect(card.querySelector('skill-cost')).toBeNull();
    });
});

describe('effect rendering', () => {
    it('renders skill effect text', () => {
        const card = createSkillCard(bleedFire);
        const effect = card.querySelector('skill-effect');
        expect(effect.textContent.trim()).toBe(bleedFire.effect);
    });
});

describe('requirement badges', () => {
    it('renders a badge for each requirement', () => {
        const card = createSkillCard(bleedFire);
        const badges = card.querySelectorAll('req-badge');
        expect(badges.length).toBe(2);
    });

    it('sets data-tree on each badge (lowercase)', () => {
        const card = createSkillCard(bleedFire);
        const badges = card.querySelectorAll('req-badge');
        const trees = [...badges].map((b) => b.dataset.tree);
        expect(trees).toContain(POLYMORPH.toLowerCase());
        expect(trees).toContain(PYROKINETIC.toLowerCase());
    });

    it('primary tree sorts last in badges', () => {
        const card = createSkillCard(bleedFire);
        const badges = card.querySelectorAll('req-badge');
        const lastBadge = badges[badges.length - 1];
        expect(lastBadge.dataset.tree).toBe(
            PYROKINETIC.toLowerCase()
        );
    });
});

describe('metadata rendering', () => {
    it('renders range and cooldown', () => {
        const card = createSkillCard(bleedFire);
        const meta = card.querySelector('skill-metadata');
        expect(meta).not.toBeNull();
        expect(meta.textContent).toContain('13m');
        expect(meta.textContent).toContain('3');
    });

    it('omits skill-metadata when neither range nor cooldown', () => {
        const card = createSkillCard(minimalSkill);
        expect(card.querySelector('skill-metadata')).toBeNull();
    });
});
