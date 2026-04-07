<script>
    import { dndzone } from 'svelte-dnd-action';
    import {
        SearchMatch, Investment, SecondaryTree, IsDual, Name,
    } from '@js/sorting.js';

    let { filter } = $props();

    function sortable(Cls, active = true) {
        const s = new Cls(filter);
        return { id: Cls.name, sortable: s, active };
    }

    let items = $state([
        sortable(SearchMatch),
        sortable(Investment),
        sortable(IsDual),
        sortable(SecondaryTree),
        sortable(Name),
    ]);

    let editing = $state(false);

    function activate(item) {
        item.active = !item.active;
    }

    function handleSort(e) {
        items = e.detail.items;
    }

    const onclick = () => editing = !editing;
</script>

<panel>
    <span>
        <hint>
            {#if !editing}
                Sort order
            {:else}
                <button class="segmented" {onclick}>
                    Done Sorting
                </button>
            {/if}
        </hint>
    </span>

    {#if !editing}
        <sort-summary role="button" {onclick}>
            {#each items.filter((i) => i.active) as item (item.id)}
                <sort-item>{item.sortable.label}</sort-item>
            {/each}
        </sort-summary>
    {:else}
        <sort-list use:dndzone={{ items, flipDurationMs: 150 }}
            onconsider={handleSort}
            onfinalize={handleSort}
        >
            {#each items as item (item.id)}
                <button
                    class:active={item.active}
                    onclick={() => activate(item)}
                >
                    {item.sortable.label}
                </button>
            {/each}
        </sort-list>
    {/if}
</panel>
