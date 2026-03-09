import { SUMMONING, ELEMENTAL_TREES } from './constants.js';
import { Skill } from './skill.js';
import {
    PRIMARY_FILTER_TREES,
    getValidSecondaryOptions,
    shouldSkillShow,
    cleanSecondaryFilters,
    parseFiltersFromURL,
    buildFilterQueryString,
    buildSummaryText,
} from './filter-logic.js';
import { createSkillCard } from './skill-card-view.js';

// ===========================
// State
// ===========================

let skillsByCategory = null;
let primaryFilter = null;
let secondaryFilters = new Set();

// ===========================
// DOM ← pure logic bridges
// ===========================

function loadFiltersFromURL() {
    const result = parseFiltersFromURL(window.location.search);
    primaryFilter = result.primaryFilter;
    secondaryFilters = result.secondaryFilters;
}

function saveFiltersToURL() {
    // `buildFilterQueryString` returns a composable string
    const qs = buildFilterQueryString(primaryFilter, secondaryFilters);
    window.history.replaceState({}, '', `${window.location.pathname}${qs}`);
}

function updateFilterSummary() {
    const summaryEl = document.getElementById('summary');
    const clearBtn = document.getElementById('clear-btn');
    const hasFilters = primaryFilter || secondaryFilters.size > 0;

    summaryEl.textContent = buildSummaryText(primaryFilter, secondaryFilters);

    if (hasFilters) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
}

// ===========================
// UI Interactions
// ===========================

function togglePrimaryFilter(tree) {
    const oldPrimary = primaryFilter;
    primaryFilter = primaryFilter === tree ? null : tree;

    if (primaryFilter !== oldPrimary) {
        secondaryFilters =
            cleanSecondaryFilters(primaryFilter, secondaryFilters);
    }

    updatePrimaryFilterButtons();
    renderSecondaryFilters();
    applyFilters();
    saveFiltersToURL();
    updateFilterSummary();
}

function toggleSecondaryFilter(tree) {
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

function renderSecondaryFilters() {
    const container = document.getElementById('secondary-filters');
    container.innerHTML = '';

    const validOptions = getValidSecondaryOptions(primaryFilter);

    validOptions.forEach(tree => {
        const btn = document.createElement('button');
        btn.className = 'tree-filter-btn';
        if (secondaryFilters.has(tree)) {
            btn.classList.add('active');
        }
        btn.textContent = tree;
        btn.dataset.tree = tree;
        btn.onclick = () => toggleSecondaryFilter(tree);
        container.appendChild(btn);
    });
}

function updatePrimaryFilterButtons() {
    document.querySelectorAll('#primary-filters .tree-filter-btn')
        .forEach(btn => {
            btn.classList.toggle('active', primaryFilter === btn.dataset.tree);
        });
}

function clearFilters() {
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

function renderSkills() {
    const container = document.getElementById('skills-container');
    container.innerHTML = '';

    const categories = [SUMMONING, ...ELEMENTAL_TREES];

    categories.forEach(category => {
        const skills = skillsByCategory[category];
        if (!skills || skills.length === 0) return;

        const sortedSkills = [...skills].sort((a, b) => {
            const treeCompare =
                a.secondaryTree.localeCompare(b.secondaryTree);
            if (treeCompare !== 0) return treeCompare;

            return a.spCost - b.spCost;
        });

        const section = document.createElement('skill-tree');
        section.setAttribute('type', category.toLowerCase());

        const header = document.createElement('tree-header');
        header.innerHTML = `
      <element-icon></element-icon>
      ${category.toUpperCase()}
    `;
        section.appendChild(header);

        sortedSkills.forEach(skill => {
            const card = createSkillCard(skill, category);
            section.appendChild(card);
        });

        container.appendChild(section);
    });
}

function applyFilters() {
    const sections = document.querySelectorAll('skill-tree');
    const noResultsEl = document.getElementById('no-results');
    let totalVisible = 0;

    sections.forEach(section => {
        const cards = section.querySelectorAll('skill-card');
        let visibleInSection = 0;

        cards.forEach(card => {
            const trees = card.dataset.trees.split(',');
            const visible = shouldSkillShow(
                trees, primaryFilter, secondaryFilters);

            card.classList.toggle('hidden', !visible);

            if (visible) visibleInSection++;
        });

        section.classList.toggle('hidden', visibleInSection === 0);
        if (visibleInSection > 0) totalVisible += visibleInSection;
    });

    noResultsEl.classList.toggle('hidden', totalVisible > 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initializePrimaryFilters() {
    const container = document.getElementById('primary-filters');

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

function initializeFilterBar() {
    const filterHeader = document.getElementById('filter-header');
    const filterContent = document.getElementById('filter-content');
    const filterOverlay = document.getElementById('filter-overlay');
    const clearBtn = document.getElementById('clear-btn');

    function closeFilters() {
        filterContent.classList.remove('expanded');
        filterOverlay.classList.remove('visible');
    }

    function openFilters() {
        filterContent.classList.add('expanded');
        filterOverlay.classList.add('visible');
    }

    filterHeader.addEventListener('click', (e) => {
        if (e.target === clearBtn || clearBtn.contains(e.target)) return;

        if (filterContent.classList.contains('expanded')) {
            closeFilters();
        } else {
            openFilters();
        }
    });

    filterOverlay.addEventListener('touchstart', (e) => {
        e.preventDefault();
        closeFilters();
    }, { passive: false });

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

async function initialize() {
    try {
        const response = await fetch('data/skills.yaml');
        const yamlText = await response.text();
        skillsByCategory = { [SUMMONING]: [] };
        ELEMENTAL_TREES.forEach(t => { skillsByCategory[t] = []; });
        for (const raw of jsyaml.load(yamlText)) {
            const skill = new Skill(raw);
            skillsByCategory[skill.primaryTree].push(skill);
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
        console.error('Failed to load skills data:', error);
        document.getElementById('skills-container').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #f88;">
                Error loading skills data. Please refresh the page.
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', initialize);
