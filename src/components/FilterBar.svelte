<script>
    import {
        ALL_TREES, VALID_SKILL_COMBINATION, NON_SUMMONING_TREES,
    } from '@constants';
    import { summaryText } from '@js/summary-text.js';

    let {
        primary = $bindable(null),
        secondaryFilters = $bindable(new Set()),
    } = $props();

    let expanded = $state(false);

    let validSecondary = $derived(
        primary ? VALID_SKILL_COMBINATION[primary] : NON_SUMMONING_TREES
    );

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function togglePrimary(tree) {
        primary = primary === tree ? null : tree;
        secondaryFilters = new Set(
            [...secondaryFilters].filter((t) => validSecondary.includes(t))
        );
        scrollToTop();
    }

    function toggleSecondary(tree) {
        const next = new Set(secondaryFilters);
        next.has(tree) ? next.delete(tree) : next.add(tree);
        secondaryFilters = next;
        scrollToTop();
    }

    function clear() {
        primary = null;
        secondaryFilters = new Set();
        scrollToTop();
    }

    let hasFilters = $derived(primary !== null || secondaryFilters.size > 0);
    let summary = $derived(summaryText(primary, secondaryFilters));
</script>

<div class="filter-overlay" class:visible={expanded}
    role="presentation"
    onclick={() => expanded = false}
></div>

<div class="filter-bar">
    <div class="filter-header"
        role="button"
        tabindex="0"
        onclick={(e) => {
            if (e.target.closest('.clear-btn')) return;
            expanded = !expanded;
        }}
        onkeydown={(e) => {
            if (e.key === 'Enter') expanded = !expanded;
        }}
    >
        <div class="filter-icon">⚙</div>
        <div class="active-filters-summary">{summary}</div>
        <div class="filter-header-buttons">
            {#if hasFilters}
                <button class="clear-btn" onclick={clear}>Reset</button>
            {/if}
        </div>
    </div>

    <div class="filter-content" class:expanded>
        <div class="filter-groups">
            <div class="filter-group">
                <div class="filter-label">
                    Primary
                    <span class="filter-label-hint">
                        (select up to one)
                    </span>
                </div>
                <div class="skill-tree-filters">
                    {#each ALL_TREES as tree}
                        <button
                            class="tree-filter-btn"
                            class:active={primary === tree}
                            onclick={() => togglePrimary(tree)}
                        >
                            {tree}
                        </button>
                    {/each}
                </div>
            </div>

            <div class="filter-group">
                <div class="filter-label">
                    Filter for
                    <span class="filter-label-hint">
                        (just need to match one of the following)
                    </span>
                </div>
                <div class="skill-tree-filters">
                    {#each validSecondary as tree}
                        <button
                            class="tree-filter-btn"
                            class:active={secondaryFilters.has(tree)}
                            onclick={() => toggleSecondary(tree)}
                        >
                            {tree}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>
