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

export const ELEMENTAL_TREES     = [PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST];
export const NON_ELEMENTAL_TREES = [WARFARE, HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER];
export const ALL_TREES           = [
  PYROKINETIC, AEROTHEURGE, GEOMANCER, HYDROSOPHIST,
  SUMMONING,
  WARFARE, HUNTSMAN, SCOUNDREL, POLYMORPH, NECROMANCER,
];
