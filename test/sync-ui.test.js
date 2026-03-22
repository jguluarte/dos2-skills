import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyFilters, syncUI } from '../js/app.js';

beforeEach(() => {
    document.body.innerHTML = `
        <div id="no-results" class="hidden"></div>
        <div id="secondary-filters"></div>
        <div id="summary"></div>
        <div id="clear-btn" class="hidden"></div>
        <div id="primary-filters"></div>
    `;
});

describe('applyFilters does not scroll', () => {
    it('does not call window.scrollTo', () => {
        const scrollSpy = vi.spyOn(window, 'scrollTo')
            .mockImplementation(() => {});

        applyFilters();

        expect(scrollSpy).not.toHaveBeenCalled();
        scrollSpy.mockRestore();
    });
});

describe('syncUI scrolls to top', () => {
    it('calls window.scrollTo with smooth scroll', () => {
        const scrollSpy = vi.spyOn(window, 'scrollTo')
            .mockImplementation(() => {});

        syncUI();

        expect(scrollSpy).toHaveBeenCalledWith(
            { top: 0, behavior: 'smooth' }
        );
        scrollSpy.mockRestore();
    });
});
