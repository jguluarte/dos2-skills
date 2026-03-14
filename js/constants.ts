/**
 * Shared constants for tree names and groupings.
 */

export const SUMMONING    = 'Summoning' as const;
export const PYROKINETIC  = 'Pyrokinetic' as const;
export const AEROTHEURGE  = 'Aerotheurge' as const;
export const GEOMANCER    = 'Geomancer' as const;
export const HYDROSOPHIST = 'Hydrosophist' as const;
export const WARFARE      = 'Warfare' as const;
export const HUNTSMAN     = 'Huntsman' as const;
export const SCOUNDREL    = 'Scoundrel' as const;
export const POLYMORPH    = 'Polymorph' as const;
export const NECROMANCER  = 'Necromancer' as const;

export type TreeName =
    | typeof SUMMONING
    | typeof PYROKINETIC
    | typeof AEROTHEURGE
    | typeof GEOMANCER
    | typeof HYDROSOPHIST
    | typeof WARFARE
    | typeof HUNTSMAN
    | typeof SCOUNDREL
    | typeof POLYMORPH
    | typeof NECROMANCER;

export const ELEMENTAL_TREES: readonly TreeName[] = [
    PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST,
] as const;

export const NON_ELEMENTAL_TREES: readonly TreeName[] = [
    WARFARE, HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER,
] as const;

export const NON_SUMMONING_TREES: readonly TreeName[] = [
    PYROKINETIC, AEROTHEURGE, GEOMANCER,
    HYDROSOPHIST, WARFARE, HUNTSMAN,
    SCOUNDREL, POLYMORPH, NECROMANCER,
] as const;

export const ALL_TREES: readonly TreeName[] = [
    ...NON_SUMMONING_TREES, SUMMONING,
] as const;

export const VALID_SKILL_COMBINATION: Record<
    TreeName, readonly TreeName[]
> = {
    [SUMMONING]: [...ELEMENTAL_TREES, NECROMANCER],

    [PYROKINETIC]:  NON_ELEMENTAL_TREES,
    [AEROTHEURGE]:  NON_ELEMENTAL_TREES,
    [GEOMANCER]:    NON_ELEMENTAL_TREES,
    [HYDROSOPHIST]: NON_ELEMENTAL_TREES,

    [WARFARE]:     ELEMENTAL_TREES,
    [HUNTSMAN]:    ELEMENTAL_TREES,
    [SCOUNDREL]:   ELEMENTAL_TREES,
    [POLYMORPH]:   ELEMENTAL_TREES,
    [NECROMANCER]: ELEMENTAL_TREES,
};
