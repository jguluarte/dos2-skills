<script>
    let props = $props();

    function onclick(e) {
        if (e.target.closest('button.reset')) return;
        props.onclick();
    }

    function clear() {
        console.log("button pushed");
    }

</script>

<header role="button" tabindex="0" onclick={onclick}>
    <icon>⚙</icon>
    <filter-summary>summary will go here</filter-summary>
    <button class="reset" onclick={clear}>Reset</button>
</header>
