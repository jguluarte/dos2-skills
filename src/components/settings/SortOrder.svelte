<script>
    import { dndzone } from 'svelte-dnd-action';
    import { DEFAULT_SORT } from '@js/sorting.js';

    let { filter } = $props();

    const STORAGE_KEY = 'sortOrder';

    function makeItem(Cls, active = true) {
        return {
            id: Cls.label,
            sortable: new Cls(filter),
            active,
        };
    }

    const labelToClass = Object.fromEntries(
        DEFAULT_SORT.map((Cls) => [Cls.label, Cls])
    );

    function loadItems() {
        let stored;
        try {
            stored = JSON.parse(
                localStorage.getItem(STORAGE_KEY) ?? 'null'
            );
        } catch {
            stored = null;
        }
        if (!Array.isArray(stored)) {
            return DEFAULT_SORT.map(
                (Cls) => makeItem(Cls)
            );
        }

        const known = new Set(Object.keys(labelToClass));
        const result = stored
            .filter((s) => known.has(s.id))
            .map((s) => makeItem(
                labelToClass[s.id], s.active
            ));

        // append any new options not in stored
        const seen = new Set(result.map((r) => r.id));
        for (const [label, Cls] of Object.entries(
            labelToClass
        )) {
            if (!seen.has(label)) {
                result.push(makeItem(Cls, false));
            }
        }
        return result;
    }

    let items = $state(loadItems());

    function handleSort(e) {
        items = e.detail.items;
    }

    let jiggling = $state(false);
    let jiggleTimer = $state(null);

    function triggerJiggle() {
        jiggling = true;
        jiggleTimer = setTimeout(
            () => jiggling = false, 2000
        );
    }

    // teardown: clear pending jiggle timer
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

{#snippet dragItem(item)}
    <sort-item class:inactive={!item.active} onclick={() => toggle(item)}>
        {item.id}
    </sort-item>
{/snippet}

<panel>
    <span><hint>Sort order — tap to disable, drag to reorder</hint></span>
    <sort-summary
        class:jiggling
        use:dndzone={{
            items,
            flipDurationMs: 150,
            // Can `dropTargetStyle` accept a class name?
            dropTargetStyle: {
                outline: '2px dashed rgba(255,255,255,0.3)',
                'border-radius': '8px',
                background: 'rgba(255,255,255,0.06)',
            },
        }}
        onconsider={(e) => { handleSort(e); triggerJiggle(); }}
        onfinalize={handleSort}
    >
        {#each items as item (item.id)}
            {@render dragItem(item)}
        {/each}
    </sort-summary>
</panel>
