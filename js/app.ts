import '../css/styles.scss';
import jsyaml from 'js-yaml';
import Handlebars from 'handlebars';
import type { TreeName } from './constants.ts';
import {
    SUMMONING, ELEMENTAL_TREES,
} from './constants.ts';
import type { RawSkill } from './skill.ts';
import { Skill } from './skill.ts';
import {
    PRIMARY_FILTER_TREES,
    getValidSecondaryOptions,
    shouldSkillShow,
    cleanSecondaryFilters,
    parseFiltersFromURL,
    buildFilterQueryString,
    buildSummaryText,
} from './filter-logic.ts';
import { createSkillCard } from './skill-card-view.ts';
import {
    registerHelpers,
} from './handlebars-helpers.ts';

registerHelpers(Handlebars);

// ===========================
// State
// ===========================

type SkillsByCategory = Record<TreeName, Skill[]>;

let skillsByCategory: SkillsByCategory | null = null;
let primaryFilter: TreeName | null = null;
let secondaryFilters = new Set<TreeName>();

// ===========================
// DOM helpers
// ===========================

function getEl(id: string): HTMLElement {
    return document.getElementById(id)!;
}

// ===========================
// DOM <-- pure logic bridges
// ===========================

function loadFiltersFromURL(): void {
    const result = parseFiltersFromURL(
        window.location.search,
    );
    primaryFilter = result.primaryFilter;
    secondaryFilters = result.secondaryFilters;
}

function saveFiltersToURL(): void {
    const qs = buildFilterQueryString(
        primaryFilter, secondaryFilters,
    );
    window.history.replaceState(
        {}, '',
        `${window.location.pathname}${qs}`,
    );
}

function updateFilterSummary(): void {
    const summaryEl = getEl('summary');
    const clearBtn = getEl('clear-btn');
    const hasFilters =
        primaryFilter || secondaryFilters.size > 0;

    summaryEl.textContent = buildSummaryText(
        primaryFilter, secondaryFilters,
    );

    if (hasFilters) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
}

// ===========================
// UI Interactions
// ===========================

function togglePrimaryFilter(tree: TreeName): void {
    const oldPrimary = primaryFilter;
    primaryFilter =
        primaryFilter === tree ? null : tree;

    if (primaryFilter !== oldPrimary) {
        secondaryFilters = cleanSecondaryFilters(
            primaryFilter, secondaryFilters,
        );
    }

    updatePrimaryFilterButtons();
    renderSecondaryFilters();
    applyFilters();
    saveFiltersToURL();
    updateFilterSummary();
}

function toggleSecondaryFilter(tree: TreeName): void {
    if (secondaryFilters.has(tree)) {
        secondaryFilters.delete(tree);
    } else {
        secondaryFilters.add(tree);
    }

    renderSecondaryFilters();
    applyFilters();
    saveFiltersToURL();
    updateFilterSummary();
}

function renderSecondaryFilters(): void {
    const container = getEl('secondary-filters');
    container.innerHTML = '';

    const validOptions =
        getValidSecondaryOptions(primaryFilter);

    validOptions.forEach(tree => {
        const btn = document.createElement('button');
        btn.className = 'tree-filter-btn';
        if (secondaryFilters.has(tree)) {
            btn.classList.add('active');
        }
        btn.textContent = tree;
        btn.dataset.tree = tree;
        btn.onclick = () => {
            toggleSecondaryFilter(tree);
        };
        container.appendChild(btn);
    });
}

function updatePrimaryFilterButtons(): void {
    const selector =
        '#primary-filters .tree-filter-btn';
    document.querySelectorAll<HTMLElement>(selector)
        .forEach(btn => {
            btn.classList.toggle(
                'active',
                primaryFilter === btn.dataset.tree,
            );
        });
}

function clearFilters(): void {
    primaryFilter = null;
    secondaryFilters.clear();
    updatePrimaryFilterButtons();
    renderSecondaryFilters();
    applyFilters();
    saveFiltersToURL();
    updateFilterSummary();
}

// ===========================
// Rendering
// ===========================

function renderSkills(): void {
    const container = getEl('skills-container');
    container.innerHTML = '';

    const categories = [SUMMONING, ...ELEMENTAL_TREES];

    categories.forEach(category => {
        const skills = skillsByCategory![category];
        if (!skills || skills.length === 0) return;

        const sortedSkills = [...skills].sort(
            (a, b) => {
                const cmp =
                    a.secondaryTree.localeCompare(
                        b.secondaryTree,
                    );
                if (cmp !== 0) return cmp;
                return a.spCost - b.spCost;
            },
        );

        const section =
            document.createElement('skill-tree');
        section.setAttribute(
            'type', category.toLowerCase(),
        );

        const header =
            document.createElement('tree-header');
        header.innerHTML = `
            <element-icon></element-icon>
            ${category.toUpperCase()}
        `;
        section.appendChild(header);

        sortedSkills.forEach(skill => {
            const card = createSkillCard(skill);
            section.appendChild(card);
        });

        container.appendChild(section);
    });
}

function applyFilters(): void {
    const sections =
        document.querySelectorAll('skill-tree');
    const noResultsEl = getEl('no-results');
    let totalVisible = 0;

    sections.forEach(section => {
        const cards =
            section.querySelectorAll<HTMLElement>(
                'skill-card',
            );
        let visibleInSection = 0;

        cards.forEach(card => {
            const trees =
                card.dataset.trees!.split(',');
            const visible = shouldSkillShow(
                trees,
                primaryFilter,
                secondaryFilters,
            );

            card.classList.toggle('hidden', !visible);

            if (visible) visibleInSection++;
        });

        section.classList.toggle(
            'hidden', visibleInSection === 0,
        );
        if (visibleInSection > 0) {
            totalVisible += visibleInSection;
        }
    });

    noResultsEl.classList.toggle(
        'hidden', totalVisible > 0,
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initializePrimaryFilters(): void {
    const container = getEl('primary-filters');

    PRIMARY_FILTER_TREES.forEach(tree => {
        const btn = document.createElement('button');
        btn.className = 'tree-filter-btn';
        btn.textContent = tree;
        btn.dataset.tree = tree;
        btn.onclick = () => togglePrimaryFilter(tree);
        container.appendChild(btn);
    });
}

// ===========================
// Event Handlers
// ===========================

function initializeFilterBar(): void {
    const filterHeader = getEl('filter-header');
    const filterContent = getEl('filter-content');
    const filterOverlay = getEl('filter-overlay');
    const clearBtn = getEl('clear-btn');

    function closeFilters(): void {
        filterContent.classList.remove('expanded');
        filterOverlay.classList.remove('visible');
    }

    function openFilters(): void {
        filterContent.classList.add('expanded');
        filterOverlay.classList.add('visible');
    }

    filterHeader.addEventListener('click', (e) => {
        const target = e.target as Node;
        if (
            target === clearBtn
            || clearBtn.contains(target)
        ) {
            return;
        }

        if (
            filterContent.classList
                .contains('expanded')
        ) {
            closeFilters();
        } else {
            openFilters();
        }
    });

    filterOverlay.addEventListener(
        'touchstart',
        (e) => {
            e.preventDefault();
            closeFilters();
        },
        { passive: false },
    );

    filterOverlay.addEventListener('click', () => {
        closeFilters();
    });

    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearFilters();
    });
}

// ===========================
// Initialization
// ===========================

async function initialize(): Promise<void> {
    try {
        const response = await fetch(
            'data/skills.yaml',
        );
        const yamlText = await response.text();
        const rawSkills =
            jsyaml.load(yamlText) as RawSkill[];

        skillsByCategory = {
            [SUMMONING]: [],
        } as SkillsByCategory;
        ELEMENTAL_TREES.forEach(t => {
            skillsByCategory![t] = [];
        });

        for (const raw of rawSkills) {
            const skill = new Skill(raw);
            skillsByCategory![skill.primaryTree]
                .push(skill);
        }

        initializePrimaryFilters();
        initializeFilterBar();
        renderSkills();

        loadFiltersFromURL();
        updatePrimaryFilterButtons();
        renderSecondaryFilters();
        applyFilters();
        updateFilterSummary();
    } catch (error) {
        console.error(
            'Failed to load skills data:', error,
        );
        getEl('skills-container').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #f88;">
                Error loading skills data.
                Please refresh the page.
            </div>
        `;
    }
}

document.addEventListener(
    'DOMContentLoaded', initialize,
);
