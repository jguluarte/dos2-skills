import { describe, it, expect } from 'vitest';
import { Skill } from '../js/skill.js';
import { createSkillCard } from '../js/skill-card-view.js';
import {
    PYROKINETIC, POLYMORPH, WARFARE,
} from '../js/constants.js';

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

// ── structure ───────────────────────────────────────────

describe('createSkillCard', () => {
    it('returns a skill-card element', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        expect(card.tagName.toLowerCase()).toBe('skill-card');
    });

    it('sets data-name to lowercase skill name', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        expect(card.dataset.name).toBe('bleed fire');
    });

    it('sets data-trees to comma-separated trees', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        expect(card.dataset.trees).toBe(
            bleedFire.trees.join(',')
        );
    });
});

// ── skill name ──────────────────────────────────────────

describe('skill name rendering', () => {
    it('renders name as a link when url is present', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        const link = card.querySelector('skill-name a');
        expect(link).not.toBeNull();
        expect(link.href).toBe('https://example.com/bleed-fire');
        expect(link.textContent.trim()).toBe('Bleed Fire');
    });

    it('renders name as a span when no url', () => {
        const card = createSkillCard(minimalSkill, PYROKINETIC);
        const span = card.querySelector('skill-name span');
        expect(span).not.toBeNull();
        expect(span.textContent.trim()).toBe('Minimal Skill');
        expect(card.querySelector('skill-name a')).toBeNull();
    });

    it('sets data-primary-tree on skill-name', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        const name = card.querySelector('skill-name');
        expect(name.dataset.primaryTree).toBe(
            PYROKINETIC.toLowerCase()
        );
    });

    it('sets data-secondary-tree on skill-name', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        const name = card.querySelector('skill-name');
        expect(name.dataset.secondaryTree).toBe(
            POLYMORPH.toLowerCase()
        );
    });
});

// ── costs ───────────────────────────────────────────────

describe('cost rendering', () => {
    it('renders AP icons', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        const apIcons = card.querySelectorAll('ap-icon');
        expect(apIcons.length).toBe(bleedFire.apCost);
    });

    it('renders SP icons', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        const spIcons = card.querySelectorAll('source-icon');
        expect(spIcons.length).toBe(bleedFire.spCost);
    });

    it('omits skill-cost when both are 0', () => {
        const card = createSkillCard(minimalSkill, PYROKINETIC);
        expect(card.querySelector('skill-cost')).toBeNull();
    });
});

// ── effect ──────────────────────────────────────────────

describe('effect rendering', () => {
    it('renders skill effect text', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        const effect = card.querySelector('skill-effect');
        expect(effect.textContent.trim()).toBe(
            'Enemies bleed fire when hit.'
        );
    });
});

// ── requirements ────────────────────────────────────────

describe('requirement badges', () => {
    it('renders a badge for each requirement', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        const badges = card.querySelectorAll('req-badge');
        expect(badges.length).toBe(2);
    });

    it('sets data-tree on each badge', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        const badges = card.querySelectorAll('req-badge');
        const trees = [...badges].map(b => b.dataset.tree);
        expect(trees).toContain(POLYMORPH.toLowerCase());
        expect(trees).toContain(PYROKINETIC.toLowerCase());
    });

    it('category tree sorts last in badges', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        const badges = card.querySelectorAll('req-badge');
        const lastBadge = badges[badges.length - 1];
        expect(lastBadge.dataset.tree).toBe(
            PYROKINETIC.toLowerCase()
        );
    });
});

// ── stats ───────────────────────────────────────────────

describe('stats rendering', () => {
    it('renders range and cooldown', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        const stats = card.querySelector('skill-stats');
        expect(stats).not.toBeNull();
        expect(stats.textContent).toContain('13m');
        expect(stats.textContent).toContain('3');
    });

    it('omits skill-stats when neither range nor cooldown', () => {
        const card = createSkillCard(minimalSkill, PYROKINETIC);
        expect(card.querySelector('skill-stats')).toBeNull();
    });
});
