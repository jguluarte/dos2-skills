import {
    SUMMONING, ALL_TREES, NON_SUMMONING_TREES,
    VALID_SKILL_COMBINATION,
} from '@constants';

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

export function shouldSkillShow(skill, filters) {
    const {
        primary,
        secondary = null,
        showSingleTree = true,
        showCrossClass = true,
    } = filters;

    // Nothing shows without a primary filter
    if (!primary) return false;

    // Skill must have the primary tree
    if (!skill.trees.includes(primary)) return false;

    // Summoning isolation: only show when explicitly selected
    const isSummoning = skill.trees.includes(SUMMONING);
    if (isSummoning && primary !== SUMMONING) return false;
    if (!isSummoning && primary === SUMMONING) return false;

    // Skill type filtering
    const isCrossClass = skill.trees.length > 1;
    if (isCrossClass && !showCrossClass) return false;
    if (!isCrossClass && !showSingleTree) return false;

    // Secondary narrows cross-class only
    if (secondary && isCrossClass) {
        if (!skill.trees.includes(secondary)) return false;
    }

    return true;
}

// ===========================
// URL state
// ===========================
export function parseFiltersFromURL(searchString) {
    const params = new URLSearchParams(searchString);

    let primary = null;
    let secondary = null;

    const p = params.get('primary');
    if (p && ALL_TREES.includes(p)) primary = p;

    const s = params.get('secondary');
    if (s && ALL_TREES.includes(s)) secondary = s;

    // Validate secondary against primary
    if (primary && secondary) {
        const valid = getValidSecondaryOptions(primary);
        if (!valid.includes(secondary)) secondary = null;
    }

    return { primary, secondary };
}

export function buildFilterQueryString(filters) {
    const params = new URLSearchParams();
    if (filters.primary) params.set('primary', filters.primary);
    if (filters.secondary) params.set('secondary', filters.secondary);
    return params.toString() ? `?${params}` : '';
}

// ===========================
// Summary text
// ===========================

/**
 * Build the filter summary string (pure — no DOM).
 */
export function buildSummaryText(filters) {
    if (!filters.primary) {
        return 'Select a skill tree to browse';
    }

    const parts = [filters.primary];
    if (filters.secondary) parts.push(filters.secondary);

    return `Showing ${parts.join(' + ')} skills`;
}
