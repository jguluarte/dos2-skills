import { describe, it, expect } from 'vitest';
import { PYROKINETIC, WARFARE, NECROMANCER, ALL_TREES } from '@constants';
import { load, serialize } from '@js/url-state.js';

// ── load ────────────────────────────────────────────────

describe('load', () => {
    it('parses primary and filters from query params', () => {
        const { primary, filters } = load(
            `?p=${PYROKINETIC}&f=${WARFARE},${NECROMANCER}`
        );

        expect(primary).toBe(PYROKINETIC);
        expect([...filters].sort()).toEqual([NECROMANCER, WARFARE]);
    });

    it('ignores invalid tree names', () => {
        const { primary, filters } = load(
            `?p=InvalidTree&f=FakeTree,${WARFARE}`
        );

        expect(primary).toBeNull();
        expect([...filters]).toEqual([WARFARE]);
    });

    it('returns null primary and empty filters for empty query', () => {
        const { primary, filters } = load('');

        expect(primary).toBeNull();
        expect(filters.size).toBe(0);
    });

    it('accepts all valid trees as primary', () => {
        for (const tree of ALL_TREES) {
            const { primary } = load(`?p=${tree}`);
            expect(primary).toBe(tree);
        }
    });
});

// ── serialize ───────────────────────────────────────────

describe('serialize', () => {
    it('serializes primary + filters', () => {
        const qs = serialize(PYROKINETIC, new Set([WARFARE]));
        expect(qs).toBe(`?p=${PYROKINETIC}&f=${WARFARE}`);
    });

    it('sorts filters alphabetically', () => {
        const qs = serialize(null, new Set([WARFARE, NECROMANCER]));
        expect(qs).toBe(`?f=${NECROMANCER},${WARFARE}`);
    });

    it('returns empty string when no filters', () => {
        expect(serialize(null, new Set())).toBe('');
    });

    it('serializes primary only', () => {
        expect(serialize(PYROKINETIC, new Set()))
            .toBe(`?p=${PYROKINETIC}`);
    });
});

// ── round-trip ──────────────────────────────────────────

describe('round-trip', () => {
    it('primary + filters survive serialize → load', () => {
        const qs = serialize(PYROKINETIC, new Set([WARFARE, NECROMANCER]));
        const { primary, filters } = load(qs);

        expect(primary).toBe(PYROKINETIC);
        expect([...filters].sort()).toEqual([NECROMANCER, WARFARE]);
    });

    for (const tree of ALL_TREES) {
        it(`${tree} survives the round-trip`, () => {
            const qs = serialize(tree, new Set());
            const { primary } = load(qs);
            expect(primary).toBe(tree);
        });
    }
});
