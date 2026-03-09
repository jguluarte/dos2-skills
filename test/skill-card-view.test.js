import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Skill } from '../js/skill.js';
import {
    createSkillCard, buildViewModel, setTemplate,
} from '../js/skill-card-view.js';
import {
    PYROKINETIC, POLYMORPH, WARFARE,
} from '../js/constants.js';

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

// ── buildViewModel ──────────────────────────────────────

describe('buildViewModel', () => {
    it('includes name', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.name).toBe('Bleed Fire');
    });

    it('lowercases name for data attribute', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.nameLower).toBe('bleed fire');
    });

    it('joins trees for data attribute', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.treesJoined).toBe(
            bleedFire.trees.join(',')
        );
    });

    it('includes url when present', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.url).toBe('https://example.com/bleed-fire');
    });

    it('url is falsy when absent', () => {
        const vm = buildViewModel(minimalSkill, PYROKINETIC);
        expect(vm.url).toBeFalsy();
    });

    it('lowercases primary and secondary tree', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.primaryTree).toBe(
            PYROKINETIC.toLowerCase()
        );
        expect(vm.secondaryTree).toBe(
            POLYMORPH.toLowerCase()
        );
    });

    it('builds AP icon array matching apCost', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.apIcons.length).toBe(bleedFire.apCost);
    });

    it('builds SP icon array matching spCost', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.spIcons.length).toBe(bleedFire.spCost);
    });

    it('hasCost is true when either cost > 0', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.hasCost).toBe(true);
    });

    it('hasCost is false when both costs are 0', () => {
        const vm = buildViewModel(minimalSkill, PYROKINETIC);
        expect(vm.hasCost).toBe(false);
    });

    it('includes effect text', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.effect).toBe('Enemies bleed fire when hit.');
    });

    it('sorts category tree last in requirements', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        const lastReq = vm.requirements[vm.requirements.length - 1];
        expect(lastReq.tree).toBe(PYROKINETIC.toLowerCase());
    });

    it('includes tree name and level in requirements', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        const polyReq = vm.requirements.find(
            r => r.tree === POLYMORPH.toLowerCase()
        );
        expect(polyReq.label).toBe(`${POLYMORPH} 2`);
    });

    it('includes range when present', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.range).toBe('13m');
    });

    it('includes cooldown when present', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.cooldown).toBe(3);
    });

    it('hasStats is true when range or cooldown exist', () => {
        const vm = buildViewModel(bleedFire, PYROKINETIC);
        expect(vm.hasStats).toBe(true);
    });

    it('hasStats is false when neither exists', () => {
        const vm = buildViewModel(minimalSkill, PYROKINETIC);
        expect(vm.hasStats).toBe(false);
    });
});

// ── createSkillCard (DOM integration) ───────────────────

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

describe('effect rendering', () => {
    it('renders skill effect text', () => {
        const card = createSkillCard(bleedFire, PYROKINETIC);
        const effect = card.querySelector('skill-effect');
        expect(effect.textContent.trim()).toBe(
            'Enemies bleed fire when hit.'
        );
    });
});

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
