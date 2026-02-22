/**
 * DOS2 Cross-Skills Lookup Tool
 * Interactive skill filter and display for Divinity Original Sin 2 cross-class abilities
 *
 * Uses custom HTML elements (skill-tree, skill-card, etc.) with CSS-driven styling.
 * All colors and presentation handled via CSS custom properties and attribute selectors.
 *
 * Pure logic lives in filter-logic.js; this file handles DOM wiring.
 */

import { SUMMONING, ELEMENTAL_TREES } from './constants.js';
import {
  PRIMARY_FILTER_TREES,
  getValidSecondaryOptions,
  shouldSkillShow,
  cleanSecondaryFilters,
  parseFiltersFromURL,
  buildFilterQueryString,
  buildSummaryText,
  highlightSpecialTerms,
  getSecondaryTree,
  groupSkillsByElement,
} from './filter-logic.js';

// ===========================
// State
// ===========================

let skillsData = null;
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
  const qs = buildFilterQueryString(primaryFilter, secondaryFilters);
  const url = qs ? `${window.location.pathname}${qs}` : window.location.pathname;
  window.history.replaceState({}, '', url);
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
    secondaryFilters = cleanSecondaryFilters(primaryFilter, secondaryFilters);
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
  document.querySelectorAll('#primary-filters .tree-filter-btn').forEach(btn => {
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
    const skills = skillsData[category];
    if (!skills || skills.length === 0) return;

    const sortedSkills = [...skills].sort((a, b) => {
      const treesA = Object.keys(a.requirements);
      const treesB = Object.keys(b.requirements);
      const secondaryA = getSecondaryTree(treesA, category) || '';
      const secondaryB = getSecondaryTree(treesB, category) || '';

      const treeCompare = secondaryA.localeCompare(secondaryB);
      if (treeCompare !== 0) return treeCompare;

      const spA = a.ability_details?.sp_cost || 0;
      const spB = b.ability_details?.sp_cost || 0;
      return spA - spB;
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

function createSkillCard(skill, category) {
  const card = document.createElement('skill-card');
  card.dataset.name = skill.name.toLowerCase();

  const trees = Object.keys(skill.requirements);
  card.dataset.trees = trees.join(',');

  const secondaryTree = getSecondaryTree(trees, category);

  const nameHTML = skill.wiki_url
    ? `<a href="${skill.wiki_url}" target="_blank" rel="noopener">
         ${skill.name}
       </a>`
    : `<span>${skill.name}</span>`;

  const nameElement = `<skill-name data-primary-tree="${category.toLowerCase()}" data-secondary-tree="${secondaryTree ? secondaryTree.toLowerCase() : category.toLowerCase()}">${nameHTML}</skill-name>`;

  let costHTML = '';
  if (skill.ability_details) {
    const icons = [];
    const sp = Math.min(skill.ability_details.sp_cost || 0, 3);
    if (sp > 0) {
      icons.push(`<span title="${sp} Source">${'<source-icon></source-icon>'.repeat(sp)}</span>`);
    }
    const ap = Math.min(skill.ability_details.ap_cost || 0, 4);
    if (ap > 0) {
      icons.push(`<span title="${ap} AP">${'<ap-icon></ap-icon>'.repeat(ap)}</span>`);
    }
    if (icons.length > 0) {
      costHTML = `<skill-cost>${icons.join('')}</skill-cost>`;
    }
  }

  let effectHTML = '';
  if (skill.ability_details?.effect) {
    const missingAttr = skill.ability_details.missing ? ' data-missing="true"' : '';
    effectHTML = `<skill-effect${missingAttr}>
      ${highlightSpecialTerms(skill.ability_details.effect, skill.ability_details.special_terms || [])}
    </skill-effect>`;
  }

  const reqBadges = Object.entries(skill.requirements)
    .sort(([treeA], [treeB]) => {
      if (treeA === category) return 1;
      if (treeB === category) return -1;
      return 0;
    })
    .map(([tree, level]) => {
      return `<req-badge data-tree="${tree.toLowerCase()}">${tree} ${level}</req-badge>`;
    })
    .join('');

  const requirementsHTML = reqBadges ? `<skill-requirements>${reqBadges}</skill-requirements>` : '';

  let statsHTML = '';
  if (skill.ability_details) {
    const hasRange = skill.ability_details.range;
    const hasCooldown = skill.ability_details.cooldown;
    if (hasRange || hasCooldown) {
      const rangeHTML = hasRange ? `Range: ${skill.ability_details.range}` : '';
      const cooldownHTML = hasCooldown ? `Cooldown: ${skill.ability_details.cooldown}` : '';
      statsHTML = `
        <skill-stats>
          <div>${rangeHTML}</div>
          <div>${cooldownHTML}</div>
        </skill-stats>
      `;
    }
  }

  card.innerHTML = `
    <skill-header>
      ${nameElement}
      ${costHTML}
    </skill-header>
    ${effectHTML}
    ${requirementsHTML}
    ${statsHTML}
  `;

  return card;
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
      const visible = shouldSkillShow(trees, primaryFilter, secondaryFilters);
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
    const SKILLS_DATA = jsyaml.load(yamlText);

    skillsData = groupSkillsByElement(SKILLS_DATA);

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
    document.getElementById('skills-container').innerHTML =
      '<div style="text-align: center; padding: 40px; color: #f88;">Error loading skills data. Please refresh the page.</div>';
  }
}

document.addEventListener('DOMContentLoaded', initialize);
