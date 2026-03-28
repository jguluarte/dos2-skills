import { describe, it, expect } from 'vitest';
import { set } from './helpers.js';
import { summaryText } from '@js/summary-text.js';
import { PYROKINETIC, WARFARE, NECROMANCER } from '@constants';

describe('summaryText', () => {
    it('no filters', () => {
        const result = summaryText();
        expect(result).toBe('Showing all skills, tap to filter');
    });

    it('primary only', () => {
        const result = summaryText(PYROKINETIC);
        expect(result).toBe(`Showing all ${PYROKINETIC} skills`);
    });

    it('primary + one filter', () => {
        const result = summaryText(PYROKINETIC, set(WARFARE));
        expect(result)
            .toBe(`Showing all ${PYROKINETIC} skills, with ${WARFARE}`);
    });

    it('primary + two filters', () => {
        const result = summaryText(PYROKINETIC, set(WARFARE, NECROMANCER));
        expect(result).toBe(
            `Showing all ${PYROKINETIC} skills,`
            + ` with ${WARFARE} or ${NECROMANCER}`
        );
    });

    it('one filter, no primary', () => {
        const result = summaryText(null, set(WARFARE));
        expect(result).toBe(`Showing all ${WARFARE} skills`);
    });

    it('multiple filters, no primary', () => {
        const result = summaryText(null, set(WARFARE, NECROMANCER));
        expect(result)
            .toBe(`Showing skills with ${WARFARE} or ${NECROMANCER}`);
    });
});
