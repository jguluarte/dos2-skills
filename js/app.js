/**
 * DOS2 Cross-Skills Lookup Tool
 * Interactive skill filter and display for Divinity Original Sin 2 cross-class abilities
 */

// ===========================
// Color Schemes
// ===========================

const ELEMENT_COLORS = {
  Pyrokinetic: '#e74c3c',
  Aerotheurge: '#3498db',
  Geomancer: '#27ae60',
  Hydrosophist: '#16a085',
  Summoning: '#9b59b6'
};

const ALL_TREE_COLORS = {
  Pyrokinetic: '#e74c3c',
  Aerotheurge: '#3498db',
  Geomancer: '#27ae60',
  Hydrosophist: '#16a085',
  Summoning: '#9b59b6',
  Necromancer: '#a64d79',
  Warfare: '#c0392b',
  Huntsman: '#558b2f',
  Scoundrel: '#6c757d',
  Polymorph: '#f39c12'
};

const ALL_TREES = [
  'Pyrokinetic',
  'Aerotheurge',
  'Geomancer',
  'Hydrosophist',
  'Summoning',
  'Warfare',
  'Huntsman',
  'Scoundrel',
  'Polymorph',
  'Necromancer'
];

const ELEMENTAL_TREES = [
  'Pyrokinetic',
  'Aerotheurge',
  'Geomancer',
  'Hydrosophist'
];

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
  if (!primary) return ALL_TREES;

  if (primary === 'Summoning') {
    // Summoning can pair with elemental + necromancer
    return [...ELEMENTAL_TREES, 'Necromancer'];
  } else if (ELEMENTAL_TREES.includes(primary)) {
    // Elemental can pair with non-elemental
    return ALL_TREES.filter(tree => !ELEMENTAL_TREES.includes(tree));
  } else {
    // Non-elemental can pair with elemental
    return ELEMENTAL_TREES;
  }
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

  updateFilterButtons();
  updateSecondaryOptions();
  applyFilters();
  saveFiltersToURL();
  updateFilterSummary();
}

/**
 * Toggle secondary (OR) filter
 */
function toggleSecondaryFilter(tree) {
  const validOptions = getValidSecondaryOptions(primaryFilter);
  if (!validOptions.includes(tree)) return;

  if (secondaryFilters.has(tree)) {
    secondaryFilters.delete(tree);
  } else {
    secondaryFilters.add(tree);
  }

  updateFilterButtons();
  applyFilters();
  saveFiltersToURL();
  updateFilterSummary();
}

/**
 * Update filter button active states
 */
function updateFilterButtons() {
  // Primary filters
  document.querySelectorAll('#primary-filters .tree-filter-btn').forEach(btn => {
    btn.classList.toggle('active', primaryFilter === btn.dataset.tree);
  });

  // Secondary filters
  document.querySelectorAll('#secondary-filters .tree-filter-btn').forEach(btn => {
    btn.classList.toggle('active', secondaryFilters.has(btn.dataset.tree));
  });
}

/**
 * Update which secondary filter options are enabled
 */
function updateSecondaryOptions() {
  const validOptions = getValidSecondaryOptions(primaryFilter);

  document.querySelectorAll('#secondary-filters .tree-filter-btn').forEach(btn => {
    btn.classList.toggle('disabled', !validOptions.includes(btn.dataset.tree));
  });
}

/**
 * Clear all filters
 */
function clearFilters() {
  primaryFilter = null;
  secondaryFilters.clear();
  updateFilterButtons();
  updateSecondaryOptions();
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

    const section = document.createElement('div');
    section.className = 'element-section';
    section.dataset.category = category;

    // Category header
    const header = document.createElement('div');
    header.className = 'element-header';
    header.style.borderLeft = `4px solid ${ELEMENT_COLORS[category]}`;
    header.innerHTML = `
      <span class="element-icon" style="background-color: ${ELEMENT_COLORS[category]}"></span>
      <span style="color: ${ELEMENT_COLORS[category]}">${category.toUpperCase()}</span>
    `;
    section.appendChild(header);

    // Skill cards
    skills.forEach(skill => {
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
  const card = document.createElement('div');
  card.className = 'skill-card';
  card.dataset.skillName = skill.name.toLowerCase();

  const trees = Object.keys(skill.requirements);
  card.dataset.trees = trees.join(',');
  card.style.borderLeftColor = ELEMENT_COLORS[category];

  // Color scheme: secondary tree for name, primary category for underline
  const primaryColor = ELEMENT_COLORS[category];
  const secondaryTree = getSecondaryTree(trees, category);
  const secondaryColor = secondaryTree ? ALL_TREE_COLORS[secondaryTree] : primaryColor;

  // Skill name
  const nameHTML = skill.has_wiki_page && skill.wiki_url
    ? `<a href="${skill.wiki_url}" target="_blank" rel="noopener"
         style="color: ${secondaryColor}; text-decoration-color: ${primaryColor};">
         ${skill.name}
       </a>`
    : `<span style="color: ${secondaryColor};">${skill.name}</span>`;

  // Cost icons
  let costHTML = '';
  if (skill.ability_details) {
    const icons = [];
    const sp = Math.min(skill.ability_details.sp_cost || 0, 3);
    if (sp > 0) {
      icons.push(`<span title="${sp} Source">${'<span class="source-icon"></span>'.repeat(sp)}</span>`);
    }
    const ap = Math.min(skill.ability_details.ap_cost || 0, 4);
    if (ap > 0) {
      icons.push(`<span title="${ap} AP">${'<span class="ap-icon"></span>'.repeat(ap)}</span>`);
    }
    if (icons.length > 0) {
      costHTML = `<div class="skill-cost">${icons.join('')}</div>`;
    }
  }

  // Effect description
  let effectHTML = '';
  if (skill.ability_details?.effect) {
    const effectClass = skill.ability_details.missing ? 'skill-effect missing' : 'skill-effect';
    effectHTML = `<div class="${effectClass}">
      ${highlightSpecialTerms(skill.ability_details.effect, skill.ability_details.special_terms || [])}
    </div>`;
  }

  // Requirements badges
  const reqBadges = Object.entries(skill.requirements)
    .map(([tree, level]) => {
      const color = ALL_TREE_COLORS[tree] || '#666';
      return `<span class="req-badge" style="color: ${color}aa;">${tree} ${level}</span>`;
    })
    .join('');

  // Stats (range/cooldown)
  let statsHTML = '';
  if (skill.ability_details) {
    const hasRange = skill.ability_details.range;
    const hasCooldown = skill.ability_details.cooldown;
    if (hasRange || hasCooldown) {
      const rangeHTML = hasRange ? `Range: ${skill.ability_details.range}` : '';
      const cooldownHTML = hasCooldown ? `Cooldown: ${skill.ability_details.cooldown}` : '';
      statsHTML = `
        <div class="skill-stats">
          <div>${rangeHTML}</div>
          <div>${cooldownHTML}</div>
        </div>
      `;
    }
  }

  card.innerHTML = `
    <div class="skill-header">
      <div class="skill-name">${nameHTML}</div>
      ${costHTML}
    </div>
    ${effectHTML}
    <div class="skill-requirements">${reqBadges}</div>
    ${statsHTML}
  `;

  return card;
}

/**
 * Apply current filters to skill cards
 */
function applyFilters() {
  const sections = document.querySelectorAll('.element-section');
  const noResultsEl = document.getElementById('no-results');
  let totalVisible = 0;

  sections.forEach(section => {
    const cards = section.querySelectorAll('.skill-card');
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
}

/**
 * Initialize filter buttons
 */
function initializeFilters() {
  const primaryContainer = document.getElementById('primary-filters');
  const secondaryContainer = document.getElementById('secondary-filters');

  ALL_TREES.forEach(tree => {
    // Primary filter button
    const primaryBtn = document.createElement('button');
    primaryBtn.className = 'tree-filter-btn';
    primaryBtn.textContent = tree;
    primaryBtn.dataset.tree = tree;
    primaryBtn.onclick = () => togglePrimaryFilter(tree);
    primaryContainer.appendChild(primaryBtn);

    // Secondary filter button
    const secondaryBtn = document.createElement('button');
    secondaryBtn.className = 'tree-filter-btn';
    secondaryBtn.textContent = tree;
    secondaryBtn.dataset.tree = tree;
    secondaryBtn.onclick = () => toggleSecondaryFilter(tree);
    secondaryContainer.appendChild(secondaryBtn);
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
  const clearBtn = document.getElementById('clear-btn');
  const closeBtn = document.getElementById('close-btn');

  // Toggle filters on mobile
  filterHeader.addEventListener('click', (e) => {
    if (e.target === clearBtn || clearBtn.contains(e.target)) return;
    if (e.target === closeBtn || closeBtn.contains(e.target)) return;

    if (window.innerWidth <= 768) {
      filterContent.classList.toggle('expanded');
    }
  });

  // Close button
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    filterContent.classList.remove('expanded');
  });

  // Clear button
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearFilters();
  });
}

/**
 * Set up auto-hide on scroll (mobile only)
 */
function initializeScrollBehavior() {
  let lastScroll = 0;
  let lastManualOpen = 0;
  const filterHeader = document.getElementById('filter-header');
  const filterContent = document.getElementById('filter-content');

  // Track manual opens
  filterHeader.addEventListener('click', () => {
    if (filterContent.classList.contains('expanded')) {
      lastManualOpen = Date.now();
    }
  });

  // Auto-hide on scroll down
  window.addEventListener('scroll', () => {
    if (window.innerWidth > 768) return;

    const currentScroll = window.pageYOffset;
    const timeSinceOpen = Date.now() - lastManualOpen;

    if (currentScroll > lastScroll && currentScroll > 50 && timeSinceOpen > 3000) {
      filterContent.classList.remove('expanded');
    }

    lastScroll = currentScroll;
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
    // Load skills data
    const response = await fetch('data/skills.json');
    const allSkills = await response.json();

    // Transform data structure to match what we need
    skillsData = {
      Summoning: [],
      Pyrokinetic: [],
      Aerotheurge: [],
      Geomancer: [],
      Hydrosophist: []
    };

    // Group skills by primary element
    allSkills.forEach(skill => {
      const trees = Object.keys(skill.requirements);

      // Summoning skills go in summoning category
      if (trees.includes('Summoning')) {
        skillsData.Summoning.push(skill);
      }
      // Otherwise, find which element tree it belongs to
      else {
        const elementTree = trees.find(t => ELEMENT_COLORS[t]);
        if (elementTree) {
          skillsData[elementTree].push(skill);
        }
      }
    });

    // Initialize UI
    initializeFilters();
    initializeFilterBar();
    initializeScrollBehavior();
    renderSkills();

    // Load saved filters
    loadFiltersFromURL();
    updateFilterButtons();
    updateSecondaryOptions();
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
