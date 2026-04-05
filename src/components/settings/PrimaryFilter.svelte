<script>
    import { ALL_TREES as trees } from '@constants';
    import TreeFilterPanel from '@components/settings/_treePanel.svelte';

    let { filter } = $props();

    function onclick(tree) {
        filter.primary = filter.primary === tree ? null : tree;
    }

    const isActive = (tree) => filter.primary === tree;
</script>

<TreeFilterPanel {trees} {onclick} {isActive}>
    {#snippet title()}
        Primary <hint>(select up to one)</hint>
    {/snippet}
</TreeFilterPanel>
