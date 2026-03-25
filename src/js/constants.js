/**
 * Shared constants for tree names and groupings.
 * Imported by app.js (and any future modules that need them).
 */

export const SUMMONING    = 'Summoning';
export const PYROKINETIC  = 'Pyrokinetic';
export const AEROTHEURGE  = 'Aerotheurge';
export const GEOMANCER    = 'Geomancer';
export const HYDROSOPHIST = 'Hydrosophist';
export const WARFARE      = 'Warfare';
export const HUNTSMAN     = 'Huntsman';
export const SCOUNDREL    = 'Scoundrel';
export const POLYMORPH    = 'Polymorph';
export const NECROMANCER  = 'Necromancer';

export const ELEMENTAL_TREES = [
    PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST,
];

export const NON_ELEMENTAL_TREES = [
    WARFARE, HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER,
];

export const NON_SUMMONING_TREES = [
    PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST, WARFARE, HUNTSMAN,
    SCOUNDREL, POLYMORPH, NECROMANCER,
];

export const ALL_TREES = [
    ...NON_SUMMONING_TREES, SUMMONING,
];

export const VALID_SKILL_COMBINATION = {
    // Summoner is treated special, and other trees don't include it
    [SUMMONING]: [...ELEMENTAL_TREES, NECROMANCER],

    // These group with non-elemental trees
    [PYROKINETIC]:  NON_ELEMENTAL_TREES,
    [AEROTHEURGE]:  NON_ELEMENTAL_TREES,
    [GEOMANCER]:    NON_ELEMENTAL_TREES,
    [HYDROSOPHIST]: NON_ELEMENTAL_TREES,

    // These skills group with elemental trees
    [WARFARE]:     ELEMENTAL_TREES,
    [HUNTSMAN]:    ELEMENTAL_TREES,
    [SCOUNDREL]:   ELEMENTAL_TREES,
    [POLYMORPH]:   ELEMENTAL_TREES,
    [NECROMANCER]: ELEMENTAL_TREES,
};
