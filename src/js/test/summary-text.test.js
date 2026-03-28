import { describe, it, expect } from 'vitest';
import { summaryText } from '@js/summary-text.js';
import { PYROKINETIC, WARFARE, NECROMANCER } from '@constants';

describe('summaryText', () => {
    it('no filters', () => {
        expect(summaryText(null, new Set()))
            .toBe('Showing all skills, tap to filter');
    });

    it('primary only', () => {
        expect(summaryText(PYROKINETIC, new Set()))
            .toBe(`Showing all ${PYROKINETIC} skills`);
    });

    it('primary + one filter', () => {
        expect(summaryText(PYROKINETIC, new Set([WARFARE])))
            .toBe(`Showing all ${PYROKINETIC} skills, with ${WARFARE}`);
    });

    it('primary + two filters', () => {
        expect(summaryText(PYROKINETIC, new Set([WARFARE, NECROMANCER])))
            .toBe(
                `Showing all ${PYROKINETIC} skills, with ${WARFARE}`
                + ` or ${NECROMANCER}`
            );
    });

    it('one filter, no primary', () => {
        expect(summaryText(null, new Set([WARFARE])))
            .toBe(`Showing all ${WARFARE} skills`);
    });

    it('multiple filters, no primary', () => {
        expect(summaryText(null, new Set([WARFARE, NECROMANCER])))
            .toBe(`Showing skills with ${WARFARE} or ${NECROMANCER}`);
    });
});
