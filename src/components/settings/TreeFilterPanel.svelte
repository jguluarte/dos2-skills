<script>
    let { title, trees, isActive, onclick } = $props();
</script>

{#snippet button(tree, active)}
    <button class="tree" class:active onclick={() => onclick(tree)}>
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
