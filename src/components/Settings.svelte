<script>
    import AnyFilterPanel from '@components/settings/AnyFilter.svelte';
    import PrimaryFilterPanel from '@components/settings/PrimaryFilter.svelte';

    let { open, settings } = $props();
</script>

<settings class:open>
    <PrimaryFilterPanel filter={settings.filter} />
    <AnyFilterPanel filter={settings.filter} />
</settings>
