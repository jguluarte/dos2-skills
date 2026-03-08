import {
    SUMMONING, ELEMENTAL_TREES, ALL_TREES, NON_SUMMONING_TREES,
    VALID_SKILL_COMBINATION,
} from './constants.js';

// ===========================
// Pairing rules
// ===========================

export const PRIMARY_FILTER_TREES = ALL_TREES;

export function getValidSecondaryOptions(primary) {
    if (primary === null) {
        return NON_SUMMONING_TREES;
    }

    return VALID_SKILL_COMBINATION[primary];
}

// ===========================
// Filter matching
// ===========================

export function shouldSkillShow(skillTrees, primaryFilter, secondaryFilters) {
    // If we don't have any filters....SHOW IT :D
    if (!primaryFilter && secondaryFilters.size === 0) return true;

    // Summoning skills are kept separate: they only appear
    // when summoning is explicitly selected, and non-summoning
    // skills are hidden when summoning is selected.
    const wantsSummoning = primaryFilter === SUMMONING;
    const isSummoning = skillTrees.includes(SUMMONING);
    if (wantsSummoning !== isSummoning) {
        return false;
    }

    const primary = !primaryFilter || skillTrees.includes(primaryFilter);

    const secondary = secondaryFilters.size === 0
        || skillTrees.some(t => secondaryFilters.has(t));

    return primary && secondary;
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

    const primaryStr = `Showing all ${primaryFilter} skills`;
    if (primaryFilter && secondaryFilters.size === 0) {
        return primaryStr;
    }

    const trees = Array.from(secondaryFilters);

    if (!primaryFilter) {
        if (trees.length === 1) return `Showing all ${trees[0]} skills`;

        const joined = trees.join(', ');
        const lastComma = joined.lastIndexOf(', ');
        const before = joined.substring(0, lastComma);
        const after = joined.substring(lastComma + 2);
        return `Showing skills with ${before} or ${after}`;
    }

    if (trees.length === 1) return `${primaryStr}, with ${trees[0]}`;

    const joined = trees.join(', ');
    const lastComma = joined.lastIndexOf(', ');
    const before = joined.substring(0, lastComma);
    const after = joined.substring(lastComma + 2);
    return `${primaryStr}, with ${before} or ${after}`;
}

// ===========================
// Skill grouping
// ===========================

export function groupSkillsByElement(skills) {
    const grouped = {
        [SUMMONING]: [],
    };
    ELEMENTAL_TREES.forEach(t => { grouped[t] = []; });

    skills.forEach(skill => {
        if (skill.isSummoning) {
            grouped[SUMMONING].push(skill);
        } else {
            const elementTree = skill.trees.find(t =>
                ELEMENTAL_TREES.includes(t));
            if (elementTree) grouped[elementTree].push(skill);
        }
    });

    return grouped;
}
