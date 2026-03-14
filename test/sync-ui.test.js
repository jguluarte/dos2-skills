import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('syncUI orchestration', () => {
    describe('applyFilters does not scroll', () => {
        it('does not call window.scrollTo', async () => {
            const scrollSpy = vi.spyOn(window, 'scrollTo')
                .mockImplementation(() => {});

            // Set up minimal DOM for applyFilters
            document.body.innerHTML = `
                <div id="no-results" class="hidden"></div>
            `;

            const { applyFilters } = await import('../js/app.js');
            applyFilters();

            expect(scrollSpy).not.toHaveBeenCalled();
            scrollSpy.mockRestore();
        });
    });

    describe('syncUI calls scrollTo', () => {
        it('scrolls to top when called', async () => {
            const scrollSpy = vi.spyOn(window, 'scrollTo')
                .mockImplementation(() => {});

            document.body.innerHTML = `
                <div id="no-results" class="hidden"></div>
                <div id="secondary-filters"></div>
                <div id="summary"></div>
                <div id="clear-btn" class="hidden"></div>
                <div id="primary-filters"></div>
            `;

            const { syncUI } = await import('../js/app.js');
            syncUI();

            expect(scrollSpy).toHaveBeenCalledWith(
                { top: 0, behavior: 'smooth' }
            );
            scrollSpy.mockRestore();
        });
    });
});
