<script>
    let { filter, onclick: click } = $props();

    function onclick(e) {
        if (e.target.closest('button.reset')) return;
        click();
    }

    let disabled = $derived(!filter.isActive());
</script>

<header role="button" tabindex="0" onclick={onclick}>
    <icon>⚙</icon>
    <filter-summary>summary will go here</filter-summary>
    <button class="reset" {disabled} onclick={filter.clear}>Reset</button>
</header>
