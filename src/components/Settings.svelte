<script>
    import AnyFilterPanel from '@components/settings/AnyFilter.svelte';
    import PrimaryFilterPanel from '@components/settings/PrimaryFilter.svelte';

    import Config from '@components/settings/_configPanel.svelte';

    let { open, filter } = $props();
</script>

<settings class:open>
    <multi-panel>
        <Config {filter} key="singleClass" label="Show single class skills?" />
        <Config {filter} key="source"      label="Show Source skills?" />
    </multi-panel>

    <PrimaryFilterPanel {filter} />
    <AnyFilterPanel {filter} />
</settings>
