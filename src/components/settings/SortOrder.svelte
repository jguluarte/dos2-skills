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

    function handleSort(e) {
        items = e.detail.items;
    }

    let jiggling = $state(false);
    let jiggleTimer;

    function triggerJiggle() {
        jiggling = true;
        clearTimeout(jiggleTimer);
        jiggleTimer = setTimeout(() => jiggling = false, 2000);
    }

    function toggle(item) {
        item.active = !item.active;
        triggerJiggle();
    }
</script>

<panel>
    <span><hint>Sort order</hint></span>
    <sort-summary
        class:jiggling
        use:dndzone={{ items, flipDurationMs: 150 }}
        onconsider={(e) => { handleSort(e); triggerJiggle(); }}
        onfinalize={handleSort}
    >
        {#each items as item (item.id)}
            <sort-item
                class:inactive={!item.active}
                onclick={() => toggle(item)}
            >
                {item.sortable.label}
            </sort-item>
        {/each}
    </sort-summary>
</panel>
