import type { TreeName } from './constants.ts';
import {
    SUMMONING, ALL_TREES, NON_SUMMONING_TREES,
    VALID_SKILL_COMBINATION,
} from './constants.ts';

// ===========================
// Pairing rules
// ===========================

export const PRIMARY_FILTER_TREES = ALL_TREES;

export function getValidSecondaryOptions(
    primary: TreeName | null,
): readonly TreeName[] {
    if (primary === null) {
        return NON_SUMMONING_TREES;
    }

    return VALID_SKILL_COMBINATION[primary];
}

// ===========================
// Filter matching
// ===========================

export function shouldSkillShow(
    skillTrees: string[],
    primaryFilter: TreeName | null,
    secondaryFilters: Set<TreeName>,
): boolean {
    if (!primaryFilter && secondaryFilters.size === 0) {
        return true;
    }

    const wantsSummoning = primaryFilter === SUMMONING;
    const isSummoning = skillTrees.includes(SUMMONING);
    if (wantsSummoning !== isSummoning) {
        return false;
    }

    const primary = !primaryFilter
        || skillTrees.includes(primaryFilter);

    const secondary = secondaryFilters.size === 0
        || skillTrees.some(
            t => secondaryFilters.has(t as TreeName),
        );

    return primary && secondary;
}

/**
 * Clean secondary filters after a primary change:
 * remove any that are no longer valid for the new
 * primary.
 */
export function cleanSecondaryFilters(
    primaryFilter: TreeName | null,
    secondaryFilters: Set<TreeName>,
): Set<TreeName> {
    const valid = getValidSecondaryOptions(primaryFilter);
    return new Set(
        [...secondaryFilters].filter(
            t => valid.includes(t),
        ),
    );
}

// ===========================
// URL state
// ===========================

export interface FilterState {
    primaryFilter: TreeName | null;
    secondaryFilters: Set<TreeName>;
}

/**
 * Parse filter state from a URL search string.
 */
export function parseFiltersFromURL(
    searchString: string,
): FilterState {
    const params = new URLSearchParams(searchString);
    let primaryFilter: TreeName | null = null;
    let secondaryFilters = new Set<TreeName>();

    const andFilter = params.get('and');
    if (
        andFilter
        && ALL_TREES.includes(andFilter as TreeName)
    ) {
        primaryFilter = andFilter as TreeName;
    }

    const orFilter = params.get('or');
    if (orFilter) {
        orFilter.split(',').forEach(tree => {
            if (ALL_TREES.includes(tree as TreeName)) {
                secondaryFilters.add(tree as TreeName);
            }
        });
    }

    secondaryFilters = cleanSecondaryFilters(
        primaryFilter, secondaryFilters,
    );

    return { primaryFilter, secondaryFilters };
}

/**
 * Build a URL search string from filter state.
 */
export function buildFilterQueryString(
    primaryFilter: TreeName | null,
    secondaryFilters: Set<TreeName>,
): string {
    const params = new URLSearchParams();
    if (primaryFilter) params.set('and', primaryFilter);
    if (secondaryFilters.size > 0) {
        params.set(
            'or',
            Array.from(secondaryFilters).sort().join(','),
        );
    }
    return params.toString() ? `?${params}` : '';
}

// ===========================
// Summary text
// ===========================

/**
 * Build the filter summary string (pure -- no DOM).
 */
export function buildSummaryText(
    primaryFilter: TreeName | null,
    secondaryFilters: Set<TreeName>,
): string {
    if (
        !primaryFilter && secondaryFilters.size === 0
    ) {
        return 'Showing all skills';
    }

    const primaryStr =
        `Showing all ${primaryFilter} skills`;
    if (primaryFilter && secondaryFilters.size === 0) {
        return primaryStr;
    }

    const trees = Array.from(secondaryFilters);

    if (!primaryFilter) {
        if (trees.length === 1) {
            return `Showing all ${trees[0]} skills`;
        }

        const { before, after } = commaizeList(trees);
        return (
            `Showing skills with ${before}`
            + ` or ${after}`
        );
    }

    if (trees.length === 1) {
        return `${primaryStr}, with ${trees[0]}`;
    }

    const { before, after } = commaizeList(trees);
    return (
        `${primaryStr}, with ${before} or ${after}`
    );
}

function commaizeList(
    list: string[],
): { before: string; after: string } {
    const joined = list.join(', ');
    const lastComma = joined.lastIndexOf(', ');
    const before = joined.substring(0, lastComma);
    const after = joined.substring(lastComma + 2);

    return { before, after };
}
