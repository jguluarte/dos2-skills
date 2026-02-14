/**
 * DOS2 Cross-Skills Lookup Tool
 * Interactive skill filter and display for Divinity Original Sin 2 cross-class abilities
 *
 * Uses custom HTML elements (skill-tree, skill-card, etc.) with CSS-driven styling.
 * All colors and presentation handled via CSS custom properties and attribute selectors.
 */

// ===========================
// Tree name constants
// ===========================
const SUMMONING = 'Summoning';
const PYROKINETIC = 'Pyrokinetic';
const AEROTHEURGE = 'Aerotheurge';
const GEOMANCER = 'Geomancer';
const HYDROSOPHIST = 'Hydrosophist';
const WARFARE = 'Warfare';
const HUNTSMAN = 'Huntsman';
const SCOUNDREL = 'Scoundrel';
const POLYMORPH = 'Polymorph';
const NECROMANCER = 'Necromancer';

const ALL_TREES = [
  PYROKINETIC,
  AEROTHEURGE,
  GEOMANCER,
  HYDROSOPHIST,
  SUMMONING,
  WARFARE,
  HUNTSMAN,
  SCOUNDREL,
  POLYMORPH,
  NECROMANCER
];

const ELEMENTAL_TREES = [
  PYROKINETIC,
  AEROTHEURGE,
  GEOMANCER,
  HYDROSOPHIST
];

const NON_ELEMENTAL_TREES = [
  WARFARE,
  HUNTSMAN,
  SCOUNDREL,
  POLYMORPH,
  NECROMANCER
];

const PRIMARY_FILTER_TREES = ALL_TREES;

// Build lookup table: when primary is X, which secondary options are valid?
const VALID_SECONDARY_BY_PRIMARY = {};

// No primary selected: all non-Summoning trees are valid
VALID_SECONDARY_BY_PRIMARY[null] = ALL_TREES.filter(tree => tree !== SUMMONING);

// Summoning pairs with elemental + necromancer
VALID_SECONDARY_BY_PRIMARY[SUMMONING] = [...ELEMENTAL_TREES, NECROMANCER];

// Elemental trees pair with non-elemental
ELEMENTAL_TREES.forEach(tree => {
  VALID_SECONDARY_BY_PRIMARY[tree] = NON_ELEMENTAL_TREES;
});

// Non-elemental trees pair with elemental
NON_ELEMENTAL_TREES.forEach(tree => {
  VALID_SECONDARY_BY_PRIMARY[tree] = ELEMENTAL_TREES;
});

// ===========================
// State Management
// ===========================

let skillsData = null;
let primaryFilter = null;
let secondaryFilters = new Set();

// ===========================
// Filter Logic
// ===========================

/**
 * Get valid secondary filter options based on current primary filter
 */
function getValidSecondaryOptions(primary) {
  return VALID_SECONDARY_BY_PRIMARY[primary] || [];
}

/**
 * Load filter state from URL parameters
 */
function loadFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  const andFilter = params.get('and');
  const orFilter = params.get('or');

  if (andFilter && ALL_TREES.includes(andFilter)) {
    primaryFilter = andFilter;
  }

  if (orFilter) {
    orFilter.split(',').forEach(tree => {
      if (ALL_TREES.includes(tree)) {
        secondaryFilters.add(tree);
      }
    });
  }

  // Validate secondary filters against primary
  const validOptions = getValidSecondaryOptions(primaryFilter);
  secondaryFilters = new Set(
    [...secondaryFilters].filter(tree => validOptions.includes(tree))
  );
}

/**
 * Save current filter state to URL
 */
function saveFiltersToURL() {
  const params = new URLSearchParams();

  if (primaryFilter) {
    params.set('and', primaryFilter);
  }

  if (secondaryFilters.size > 0) {
    params.set('or', Array.from(secondaryFilters).sort().join(','));
  }

  const url = params.toString()
    ? `${window.location.pathname}?${params}`
    : window.location.pathname;

  window.history.replaceState({}, '', url);
}

/**
 * Update the filter summary text
 */
function updateFilterSummary() {
  const summaryEl = document.getElementById('summary');
  const clearBtn = document.getElementById('clear-btn');
  const hasFilters = primaryFilter || secondaryFilters.size > 0;

  if (!hasFilters) {
    summaryEl.textContent = 'Showing all skills';
    clearBtn.classList.add('hidden');
    return;
  }

  clearBtn.classList.remove('hidden');

  let text = '';

  if (primaryFilter && secondaryFilters.size === 0) {
    text = `Showing all ${primaryFilter} skills`;
  } else if (!primaryFilter && secondaryFilters.size > 0) {
    const trees = Array.from(secondaryFilters);
    if (trees.length === 1) {
      text = `Showing all ${trees[0]} skills`;
    } else {
      const joined = trees.join(', ');
      const lastComma = joined.lastIndexOf(', ');
      text = `Showing skills with ${joined.substring(0, lastComma)} or ${joined.substring(lastComma + 2)}`;
    }
  } else if (primaryFilter && secondaryFilters.size > 0) {
    const trees = Array.from(secondaryFilters);
    if (trees.length === 1) {
      text = `Showing all ${primaryFilter} skills, with ${trees[0]}`;
    } else {
      const joined = trees.join(', ');
      const lastComma = joined.lastIndexOf(', ');
      text = `Showing all ${primaryFilter} skills, with ${joined.substring(0, lastComma)} or ${joined.substring(lastComma + 2)}`;
    }
  }

  summaryEl.textContent = text;
}

// ===========================
// UI Interactions
// ===========================

/**
 * Toggle primary (AND) filter
 */
function togglePrimaryFilter(tree) {
  const oldPrimary = primaryFilter;
  primaryFilter = primaryFilter === tree ? null : tree;

  // Clean up secondary filters if primary changed
  if (primaryFilter !== oldPrimary) {
    const validOptions = getValidSecondaryOptions(primaryFilter);
    secondaryFilters = new Set(
      [...secondaryFilters].filter(tree => validOptions.includes(tree))
    );
  }

  updatePrimaryFilterButtons();
  renderSecondaryFilters();
  applyFilters();
  saveFiltersToURL();
  updateFilterSummary();
}

/**
 * Toggle secondary (OR) filter
 */
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

/**
 * Render secondary filter buttons based on current primary selection
 */
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

/**
 * Update primary filter button active states
 */
function updatePrimaryFilterButtons() {
  document.querySelectorAll('#primary-filters .tree-filter-btn').forEach(btn => {
    btn.classList.toggle('active', primaryFilter === btn.dataset.tree);
  });
}

/**
 * Clear all filters
 */
function clearFilters() {
  primaryFilter = null;
  secondaryFilters.clear();
  updatePrimaryFilterButtons();
  renderSecondaryFilters();
  applyFilters();
  saveFiltersToURL();
  updateFilterSummary();
}

/**
 * Highlight special terms in skill effect text
 */
function highlightSpecialTerms(text, terms) {
  if (!terms || terms.length === 0) return text;

  let result = text;
  terms.forEach(term => {
    result = result.replace(
      new RegExp(`\\b${term}\\b`, 'gi'),
      `<span class="special-term">${term}</span>`
    );
  });

  return result;
}

/**
 * Get the secondary tree for a skill (the one that's not the category)
 */
function getSecondaryTree(skillTrees, primaryCategory) {
  return skillTrees.find(tree => tree !== primaryCategory) || null;
}

// ===========================
// Rendering
// ===========================

/**
 * Render all skills grouped by element
 */
function renderSkills() {
  const container = document.getElementById('skills-container');
  container.innerHTML = '';

  const categories = ['Summoning', 'Pyrokinetic', 'Aerotheurge', 'Geomancer', 'Hydrosophist'];

  categories.forEach(category => {
    const skills = skillsData[category];
    if (!skills || skills.length === 0) return;

    // Sort skills by their secondary tree for easier scanning
    const sortedSkills = [...skills].sort((a, b) => {
      const treesA = Object.keys(a.requirements);
      const treesB = Object.keys(b.requirements);
      const secondaryA = getSecondaryTree(treesA, category) || '';
      const secondaryB = getSecondaryTree(treesB, category) || '';

      // First sort by secondary tree
      const treeCompare = secondaryA.localeCompare(secondaryB);
      if (treeCompare !== 0) return treeCompare;

      // If same secondary tree, skills WITHOUT source cost come first
      const spA = a.ability_details?.sp_cost || 0;
      const spB = b.ability_details?.sp_cost || 0;
      return spA - spB;
    });

    const section = document.createElement('skill-tree');
    section.setAttribute('type', category.toLowerCase());

    // Category header
    const header = document.createElement('tree-header');
    header.innerHTML = `
      <element-icon></element-icon>
      ${category.toUpperCase()}
    `;
    section.appendChild(header);

    // Skill cards
    sortedSkills.forEach(skill => {
      const card = createSkillCard(skill, category);
      section.appendChild(card);
    });

    container.appendChild(section);
  });
}

/**
 * Create a skill card element
 */
function createSkillCard(skill, category) {
  const card = document.createElement('skill-card');
  card.dataset.name = skill.name.toLowerCase();

  const trees = Object.keys(skill.requirements);
  card.dataset.trees = trees.join(',');

  // Get secondary tree for data attributes
  const secondaryTree = getSecondaryTree(trees, category);

  // Skill name
  const nameHTML = skill.wiki_url
    ? `<a href="${skill.wiki_url}" target="_blank" rel="noopener">
         ${skill.name}
       </a>`
    : `<span>${skill.name}</span>`;

  const nameElement = `<skill-name data-primary-tree="${category.toLowerCase()}" data-secondary-tree="${secondaryTree ? secondaryTree.toLowerCase() : category.toLowerCase()}">${nameHTML}</skill-name>`;

  // Cost icons
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

  // Effect description
  let effectHTML = '';
  if (skill.ability_details?.effect) {
    const missingAttr = skill.ability_details.missing ? ' data-missing="true"' : '';
    effectHTML = `<skill-effect${missingAttr}>
      ${highlightSpecialTerms(skill.ability_details.effect, skill.ability_details.special_terms || [])}
    </skill-effect>`;
  }

  // Requirements badges - partner skill first, then primary category
  const reqBadges = Object.entries(skill.requirements)
    .sort(([treeA], [treeB]) => {
      // Put secondary tree first, primary category second
      if (treeA === category) return 1;
      if (treeB === category) return -1;
      return 0;
    })
    .map(([tree, level]) => {
      return `<req-badge data-tree="${tree.toLowerCase()}">${tree} ${level}</req-badge>`;
    })
    .join('');

  const requirementsHTML = reqBadges ? `<skill-requirements>${reqBadges}</skill-requirements>` : '';

  // Stats (range/cooldown)
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

/**
 * Apply current filters to skill cards
 */
function applyFilters() {
  const sections = document.querySelectorAll('skill-tree');
  const noResultsEl = document.getElementById('no-results');
  let totalVisible = 0;

  sections.forEach(section => {
    const cards = section.querySelectorAll('skill-card');
    let visibleInSection = 0;

    cards.forEach(card => {
      const trees = card.dataset.trees.split(',');
      let shouldShow = false;

      if (!primaryFilter && secondaryFilters.size === 0) {
        // No filters - show all
        shouldShow = true;
      } else {
        const hasSummoning = trees.includes('Summoning');

        // Check primary filter match
        let matchesPrimary = true;
        if (primaryFilter) {
          matchesPrimary = trees.includes(primaryFilter);
        }

        // Check secondary filter match
        let matchesSecondary = true;
        if (secondaryFilters.size > 0) {
          matchesSecondary = [...secondaryFilters].some(tree => trees.includes(tree));
        }

        if (hasSummoning) {
          // Summoning skill: exclude if primary is elemental/necro
          const primaryIsElementalOrNecro = primaryFilter &&
            ['Pyrokinetic', 'Aerotheurge', 'Geomancer', 'Hydrosophist', 'Necromancer'].includes(primaryFilter);
          shouldShow = !primaryIsElementalOrNecro && matchesPrimary && matchesSecondary;
        } else {
          // Non-summoning skill: exclude if summoning is in filters
          const summoningInFilters = primaryFilter === 'Summoning' || secondaryFilters.has('Summoning');
          shouldShow = !summoningInFilters && matchesPrimary && matchesSecondary;
        }
      }

      card.classList.toggle('hidden', !shouldShow);
      if (shouldShow) visibleInSection++;
    });

    section.classList.toggle('hidden', visibleInSection === 0);
    if (visibleInSection > 0) totalVisible += visibleInSection;
  });

  noResultsEl.classList.toggle('hidden', totalVisible > 0);

  // Always scroll to top when filters change (standard pattern)
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Initialize primary filter buttons (only needs to run once)
 */
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

/**
 * Set up filter bar interactions
 */
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

  // Toggle filters (CSS controls mobile vs desktop behavior)
  filterHeader.addEventListener('click', (e) => {
    if (e.target === clearBtn || clearBtn.contains(e.target)) return;

    if (filterContent.classList.contains('expanded')) {
      closeFilters();
    } else {
      openFilters();
    }
  });

  // Overlay touch/click closes filter
  // Use touchstart on mobile to prevent scrolling underneath
  filterOverlay.addEventListener('touchstart', (e) => {
    e.preventDefault();
    closeFilters();
  }, { passive: false });

  // Still handle click for desktop/mouse users
  filterOverlay.addEventListener('click', () => {
    closeFilters();
  });

  // Clear button
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearFilters();
  });
}


// ===========================
// Initialization
// ===========================

/**
 * Load skills data and initialize app
 */
async function initialize() {
  try {
    // Fetch and parse YAML data
    const response = await fetch('data/skills.yaml');
    const yamlText = await response.text();
    const SKILLS_DATA = jsyaml.load(yamlText);

    // Transform data structure to match what we need
    skillsData = {
      Summoning: [],
      Pyrokinetic: [],
      Aerotheurge: [],
      Geomancer: [],
      Hydrosophist: []
    };

    // Group skills by primary element
    const elementTrees = ['Pyrokinetic', 'Aerotheurge', 'Geomancer', 'Hydrosophist'];

    SKILLS_DATA.forEach(skill => {
      const trees = Object.keys(skill.requirements);

      // Summoning skills go in summoning category
      if (trees.includes('Summoning')) {
        skillsData.Summoning.push(skill);
      }
      // Otherwise, find which element tree it belongs to
      else {
        const elementTree = trees.find(t => elementTrees.includes(t));
        if (elementTree) {
          skillsData[elementTree].push(skill);
        }
      }
    });

    // Initialize UI
    initializePrimaryFilters();
    initializeFilterBar();
    renderSkills();

    // Load saved filters
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

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);
