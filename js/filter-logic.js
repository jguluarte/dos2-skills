/**
 * Pure filter logic — no DOM, no side effects.
 *
 * Every function here takes data in and returns a result. This module can
 * be require()'d directly in tests without any DOM mocking or vm tricks.
 */

import {
  SUMMONING, ELEMENTAL_TREES, NON_ELEMENTAL_TREES, ALL_TREES,
  NECROMANCER,
} from './constants.js';

// ===========================
// Pairing rules
// ===========================

const VALID_SECONDARY_BY_PRIMARY = {};

VALID_SECONDARY_BY_PRIMARY[null] = ALL_TREES.filter(t => t !== SUMMONING);
VALID_SECONDARY_BY_PRIMARY[SUMMONING] = [...ELEMENTAL_TREES, NECROMANCER];
ELEMENTAL_TREES.forEach(t => { VALID_SECONDARY_BY_PRIMARY[t] = NON_ELEMENTAL_TREES; });
NON_ELEMENTAL_TREES.forEach(t => { VALID_SECONDARY_BY_PRIMARY[t] = ELEMENTAL_TREES; });

export const PRIMARY_FILTER_TREES = ALL_TREES;

/**
 * Get valid secondary filter options for a given primary.
 */
export function getValidSecondaryOptions(primary) {
  return VALID_SECONDARY_BY_PRIMARY[primary] || [];
}

// ===========================
// Filter matching
// ===========================

/**
 * Determine whether a skill should be visible given current filters.
 * @param {string[]} skillTrees - tree names the skill belongs to
 * @param {string|null} primaryFilter - current primary filter (or null)
 * @param {Set<string>} secondaryFilters - current secondary filters
 * @returns {boolean}
 */
export function shouldSkillShow(skillTrees, primaryFilter, secondaryFilters) {
  if (!primaryFilter && secondaryFilters.size === 0) return true;

  const hasSummoning = skillTrees.includes(SUMMONING);

  let matchesPrimary = true;
  if (primaryFilter) {
    matchesPrimary = skillTrees.includes(primaryFilter);
  }

  let matchesSecondary = true;
  if (secondaryFilters.size > 0) {
    matchesSecondary = [...secondaryFilters].some(t => skillTrees.includes(t));
  }

  if (hasSummoning) {
    const summoningExplicit = primaryFilter === SUMMONING || secondaryFilters.has(SUMMONING);
    const hasAnyFilter = primaryFilter || secondaryFilters.size > 0;
    return (!hasAnyFilter || summoningExplicit) && matchesPrimary && matchesSecondary;
  }

  const summoningInFilters = primaryFilter === SUMMONING || secondaryFilters.has(SUMMONING);
  return !summoningInFilters && matchesPrimary && matchesSecondary;
}

/**
 * Clean secondary filters after a primary change: remove any that are
 * no longer valid for the new primary.
 */
export function cleanSecondaryFilters(primaryFilter, secondaryFilters) {
  const valid = getValidSecondaryOptions(primaryFilter);
  return new Set([...secondaryFilters].filter(t => valid.includes(t)));
}

// ===========================
// URL state
// ===========================

/**
 * Parse filter state from a URL search string.
 * @param {string} searchString - e.g. "?and=Pyrokinetic&or=Warfare,Necromancer"
 * @returns {{ primaryFilter: string|null, secondaryFilters: Set<string> }}
 */
export function parseFiltersFromURL(searchString) {
  const params = new URLSearchParams(searchString);
  let primaryFilter = null;
  let secondaryFilters = new Set();

  const andFilter = params.get('and');
  if (andFilter && ALL_TREES.includes(andFilter)) {
    primaryFilter = andFilter;
  }

  const orFilter = params.get('or');
  if (orFilter) {
    orFilter.split(',').forEach(tree => {
      if (ALL_TREES.includes(tree)) secondaryFilters.add(tree);
    });
  }

  // Validate secondaries against primary
  secondaryFilters = cleanSecondaryFilters(primaryFilter, secondaryFilters);

  return { primaryFilter, secondaryFilters };
}

/**
 * Build a URL search string from filter state.
 * @returns {string} e.g. "?and=Pyrokinetic&or=Warfare" or ""
 */
export function buildFilterQueryString(primaryFilter, secondaryFilters) {
  const params = new URLSearchParams();
  if (primaryFilter) params.set('and', primaryFilter);
  if (secondaryFilters.size > 0) {
    params.set('or', Array.from(secondaryFilters).sort().join(','));
  }
  return params.toString() ? `?${params}` : '';
}

// ===========================
// Summary text
// ===========================

/**
 * Build the filter summary string (pure — no DOM).
 */
export function buildSummaryText(primaryFilter, secondaryFilters) {
  if (!primaryFilter && secondaryFilters.size === 0) {
    return 'Showing all skills';
  }

  if (primaryFilter && secondaryFilters.size === 0) {
    return `Showing all ${primaryFilter} skills`;
  }

  const trees = Array.from(secondaryFilters);

  if (!primaryFilter) {
    if (trees.length === 1) return `Showing all ${trees[0]} skills`;
    const joined = trees.join(', ');
    const lastComma = joined.lastIndexOf(', ');
    return `Showing skills with ${joined.substring(0, lastComma)} or ${joined.substring(lastComma + 2)}`;
  }

  if (trees.length === 1) {
    return `Showing all ${primaryFilter} skills, with ${trees[0]}`;
  }
  const joined = trees.join(', ');
  const lastComma = joined.lastIndexOf(', ');
  return `Showing all ${primaryFilter} skills, with ${joined.substring(0, lastComma)} or ${joined.substring(lastComma + 2)}`;
}

// ===========================
// Utility functions
// ===========================

/**
 * Highlight special terms in skill effect text.
 */
export function highlightSpecialTerms(text, terms) {
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
 * Get the secondary tree for a skill (the one that's not the category).
 */
export function getSecondaryTree(skillTrees, primaryCategory) {
  return skillTrees.find(tree => tree !== primaryCategory) || null;
}

/**
 * Group flat skills array by primary element, matching the app's display categories.
 */
export function groupSkillsByElement(skills) {
  const grouped = {
    [SUMMONING]: [],
  };
  ELEMENTAL_TREES.forEach(t => { grouped[t] = []; });

  skills.forEach(skill => {
    const trees = Object.keys(skill.requirements);
    if (trees.includes(SUMMONING)) {
      grouped[SUMMONING].push(skill);
    } else {
      const elementTree = trees.find(t => ELEMENTAL_TREES.includes(t));
      if (elementTree) grouped[elementTree].push(skill);
    }
  });

  return grouped;
}
