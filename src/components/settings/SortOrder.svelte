<script>
    import { dndzone } from 'svelte-dnd-action';
    import { DEFAULT_SORT } from '@js/sorting.js';

    let { filter } = $props();

    const STORAGE_KEY = 'sortOrder';

    const allOptions = Object.fromEntries(
        DEFAULT_SORT.map((Cls) => [Cls.name, Cls])
    );

    const defaults = DEFAULT_SORT.map((Cls) => Cls.name);

    function sortable(id, active = true) {
        return { id, sortable: new allOptions[id](filter), active };
    }

    function loadItems() {
        const stored = JSON.parse(
            localStorage.getItem(STORAGE_KEY) ?? 'null'
        );
        if (!stored) return defaults.map((id) => sortable(id));

        const known = new Set(Object.keys(allOptions));
        const result = stored
            .filter((s) => known.has(s.id))
            .map((s) => sortable(s.id, s.active));

        // append any new options not in stored
        const seen = new Set(result.map((r) => r.id));
        for (const id of defaults) {
            if (!seen.has(id)) result.push(sortable(id, false));
        }
        return result;
    }

    let items = $state(loadItems());

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

    $effect(() => () => clearTimeout(jiggleTimer));

    function toggle(item) {
        item.active = !item.active;
        triggerJiggle();
    }

    function syncSorting() {
        filter.sorting = items
            .filter((i) => i.active)
            .map((i) => i.sortable.sort);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(
            items.map(({ id, active }) => ({ id, active }))
        ));
    }

    $effect(syncSorting);
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
