<script>
    import SettingsPanel from '@components/Settings.svelte';

    import { summarize } from '@js/filter.js';

    let { filter } = $props();

    let open = $state(false);
    const onclick = () => open = !open;
</script>

<overlay class:open role="presentation" {onclick} ></overlay>

<action-bar>
    <header role="button" {onclick}>
        <icon >⚙</icon>
        <filter-summary>{summarize(filter)}</filter-summary>
    </header>

    <SettingsPanel {open} {filter} />
</action-bar>
