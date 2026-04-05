<script>
    import { TRI_STATE } from '@constants';
    let { label, options = TRI_STATE, filter, key } = $props();

    const isActive = (choice) => filter[key] === choice;
    const onclick  = (choice) => filter[key] = choice;
</script>

{#snippet button(text)}
    <button class:active={isActive(text)} onclick={() => onclick(text)}>
        {text}
    </button>
{/snippet}

<panel>
    <span>
        <hint>{label}</hint>
    </span>
    <segmented>
        {#each Object.values(options) as option (option)}
            {@render button(option)}
        {/each}
    </segmented>
</panel>
