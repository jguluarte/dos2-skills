<script>
    import PrimaryFilterPanel from '@components/settings/PrimaryFilter.svelte';
    import AnyFilterPanel from '@components/settings/AnyFilter.svelte';

    let { open, filter } = $props();

</script>

<settings class:open>

    <PrimaryFilterPanel {filter} />
    <AnyFilterPanel {filter} />

</settings>
