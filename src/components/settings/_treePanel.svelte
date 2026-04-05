<script>
    let { title, trees, isActive, onclick, disabled = false } = $props();
</script>

{#snippet button(tree, active)}
    <button class:active {disabled} onclick={() => onclick(tree)}>
        {tree}
    </button>
{/snippet}

<panel>
    <span>{@render title()}</span>

    <buttons>
        {#each trees as tree}
            {@render button(tree, isActive(tree))}
        {/each}
    </buttons>
</panel>
