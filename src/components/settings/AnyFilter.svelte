<script>
    import { ALL_TREES, VALID_SKILL_COMBINATION } from '@constants';
    import TreeFilterPanel from '@components/settings/TreeFilterPanel.svelte';

    let { filter } = $props();

    let trees = $derived(
        filter.primary ? VALID_SKILL_COMBINATION[filter.primary] : ALL_TREES
    );

    function onclick(tree) {
        const { any } = filter;
        any.has(tree) ? any.delete(tree) : any.add(tree);
    }

    const isActive = (tree) => filter.any.has(tree);

    $effect.pre(() => {
        if (filter.primary === null) {
            // if the primary filter was removed...clear these
            filter.any.clear();

        } else {
            // otherwise remove any filter that isn't in the new list
            filter.any.forEach((t) => {
                if (!trees.includes(t)) filter.any.delete(t);
            });
        }
    });

</script>

<TreeFilterPanel {trees} {onclick} {isActive}>
    {#snippet title()}
        Filter for <hint>(just need to match one of the following)</hint>
    {/snippet}
</TreeFilterPanel>
