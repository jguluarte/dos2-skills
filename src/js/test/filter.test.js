import { describe, it, expect } from 'vitest';
import { set } from './helpers.js';
import { PYROKINETIC, NECROMANCER, WARFARE } from '@constants';
import { summarize } from '@js/filter.js';

// ── summarize ───────────────────────────────────────────

describe('summarize', () => {
    it('no filters', () => {
        const result = summarize({ primary: null, any: null });
        expect(result).toBe('Showing all skills, tap to filter');
    });

    it('primary only', () => {
        const result = summarize({
            primary: PYROKINETIC, any: null,
        });
        expect(result).toBe(`Showing all ${PYROKINETIC} skills`);
    });

    it('primary + one filter', () => {
        const result = summarize({
            primary: PYROKINETIC, any: set(WARFARE),
        });
        expect(result)
            .toBe(`Showing all ${PYROKINETIC} skills, with ${WARFARE}`);
    });

    it('primary + two filters', () => {
        const result = summarize({
            primary: PYROKINETIC,
            any: set(WARFARE, NECROMANCER),
        });
        expect(result).toBe(
            `Showing all ${PYROKINETIC} skills,`
            + ` with ${WARFARE} or ${NECROMANCER}`
        );
    });

    it('one filter, no primary', () => {
        const result = summarize({
            primary: null, any: set(WARFARE),
        });
        expect(result).toBe(`Showing all ${WARFARE} skills`);
    });

    it('multiple filters, no primary', () => {
        const result = summarize({
            primary: null,
            any: set(WARFARE, NECROMANCER),
        });
        expect(result)
            .toBe(`Showing skills with ${WARFARE} or ${NECROMANCER}`);
    });
});
