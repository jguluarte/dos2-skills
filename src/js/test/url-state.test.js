import { describe, it, expect } from 'vitest';
import {
    PYROKINETIC, WARFARE, NECROMANCER, ALL_TREES, TRI_STATE,
} from '@constants';
import { load, serialize } from '@js/url-state.js';

const { YES, NO, ONLY } = TRI_STATE;

// ── load ────────────────────────────────────────────────

describe('load', () => {
    it('parses primary and any from query params', () => {
        const { primary, any } = load(
            `?primary=${PYROKINETIC}&any=${WARFARE}&any=${NECROMANCER}`
        );

        expect(primary).toBe(PYROKINETIC);
        expect([...any].sort()).toEqual([NECROMANCER, WARFARE]);
    });

    it('ignores invalid tree names', () => {
        const { primary, any } = load(
            `?primary=InvalidTree&any=FakeTree&any=${WARFARE}`
        );

        expect(primary).toBeNull();
        expect([...any]).toEqual([WARFARE]);
    });

    it('returns null primary and empty set for empty query', () => {
        const { primary, any } = load('');

        expect(primary).toBeNull();
        expect(any.size).toBe(0);
    });

    it('accepts all valid trees as primary', () => {
        for (const tree of ALL_TREES) {
            const { primary } = load(`?primary=${tree}`);
            expect(primary).toBe(tree);
        }
    });
});

// ── serialize ───────────────────────────────────────────

describe('serialize', () => {
    it('serializes primary + any', () => {
        const qs = serialize({
            primary: PYROKINETIC,
            any: new Set([WARFARE]),
        });
        expect(qs).toBe(`?primary=${PYROKINETIC}&any=${WARFARE}`);
    });

    it('sorts any filters alphabetically', () => {
        const qs = serialize({
            primary: null,
            any: new Set([WARFARE, NECROMANCER]),
        });
        expect(qs).toBe(`?any=${NECROMANCER}&any=${WARFARE}`);
    });

    it('returns empty string when no filters', () => {
        expect(serialize({
            primary: null,
            any: new Set(),
        })).toBe('');
    });

    it('serializes primary only', () => {
        expect(serialize({
            primary: PYROKINETIC,
            any: new Set(),
        })).toBe(`?primary=${PYROKINETIC}`);
    });
});

// ── round-trip ──────────────────────────────────────────

describe('round-trip', () => {
    it('primary + any survive serialize → load', () => {
        const qs = serialize({
            primary: PYROKINETIC,
            any: new Set([WARFARE, NECROMANCER]),
        });
        const { primary, any } = load(qs);

        expect(primary).toBe(PYROKINETIC);
        expect([...any].sort()).toEqual([NECROMANCER, WARFARE]);
    });

    for (const tree of ALL_TREES) {
        it(`${tree} survives the round-trip`, () => {
            const qs = serialize({
                primary: tree,
                any: new Set(),
            });
            const { primary } = load(qs);
            expect(primary).toBe(tree);
        });
    }
});

// ── singleClass & source ───────────────────────────────

describe('singleClass param', () => {
    it('loads valid singleClass value', () => {
        const { singleClass } = load(`?singleClass=${ONLY}`);
        expect(singleClass).toBe(ONLY);
    });

    it('defaults to YES when absent', () => {
        const { singleClass } = load('');
        expect(singleClass).toBe(YES);
    });

    it('defaults to YES for invalid value', () => {
        const { singleClass } = load('?singleClass=Bogus');
        expect(singleClass).toBe(YES);
    });

    it('serializes singleClass', () => {
        const qs = serialize({
            primary: null, any: new Set(),
            singleClass: ONLY, source: YES,
        });
        expect(qs).toContain(`singleClass=${ONLY}`);
    });

});

describe('source param', () => {
    it('loads valid source value', () => {
        const { source } = load(`?source=${NO}`);
        expect(source).toBe(NO);
    });

    it('defaults to YES when absent', () => {
        const { source } = load('');
        expect(source).toBe(YES);
    });

    it('defaults to YES for invalid value', () => {
        const { source } = load('?source=Invalid');
        expect(source).toBe(YES);
    });

    it('serializes source', () => {
        const qs = serialize({
            primary: null, any: new Set(),
            singleClass: YES, source: ONLY,
        });
        expect(qs).toContain(`source=${ONLY}`);
    });

});

describe('round-trip with all params', () => {
    it('all params survive serialize → load', () => {
        const qs = serialize({
            primary: PYROKINETIC,
            any: new Set([WARFARE]),
            singleClass: ONLY,
            source: NO,
        });
        const result = load(qs);

        expect(result.primary).toBe(PYROKINETIC);
        expect([...result.any]).toEqual([WARFARE]);
        expect(result.singleClass).toBe(ONLY);
        expect(result.source).toBe(NO);
    });
});
