<script>
    import { ALL_TREES, VALID_SKILL_COMBINATION } from '@constants';
    import TreeFilterPanel from '@components/settings/TreeFilterPanel.svelte';

    let { open, filter } = $props();

    let secondaryTrees = $derived(
        filter.primary ? VALID_SKILL_COMBINATION[filter.primary] : ALL_TREES
    );

    function clickPrimary(tree) {
        filter.primary = filter.primary === tree ? null : tree;
    }

    function clickSecondary(tree) {
        const { any } = filter;
        any.has(tree) ? any.delete(tree) : any.add(tree);
    }

    $effect.pre(() => {
        if (filter.primary === null) {
            filter.any.clear();

        } else {
            filter.any.forEach((t) => {
                if (!secondaryTrees.includes(t)) filter.any.delete(t);
            });
        }
    });

</script>

{#snippet primaryTitle()}
    Primary <hint>(select up to one)</hint>
{/snippet}

{#snippet secondaryTitle()}
    Filter for <hint>(just need to match one of the following)</hint>
{/snippet}

<settings class:open>

    <TreeFilterPanel
        trees={ALL_TREES}
        title={primaryTitle}

        onclick={clickPrimary}
        isActive={(tree) => filter.primary === tree}
    />

    <TreeFilterPanel
        trees={secondaryTrees}
        title={secondaryTitle}

        onclick={clickSecondary}
        isActive={(tree) => filter.any.has(tree)}
    />

</settings>
