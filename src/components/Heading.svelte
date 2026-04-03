<script>
    import SettingsPanel from '@components/Settings.svelte';
    import { summarize } from '@js/filter.js';

    let { settings } = $props();

    let open = $state(false);
    const toggle = () => open = !open;
    const reset  = () => settings.filter.clear();

    let disabled = $derived(!settings.filter.isActive());

    function openSettings(e) {
        if (e.target.closest('button.reset')) return;
        toggle();
    }

    // FIXME: I want to redo this summarization text
    let summary = $derived(
        summarize(settings.filter.primary, settings.filter.any)
    );
</script>

<overlay class:open role="presentation" onclick={toggle}></overlay>

<action-bar>
    <header role="button" tabindex="0" onclick={openSettings}>
        <icon>⚙</icon>
        <filter-summary>{summary}</filter-summary>
        <button class="reset" {disabled} onclick={reset}>Reset</button>
    </header>

    <SettingsPanel {open} {settings} />
</action-bar>
