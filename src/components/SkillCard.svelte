<script lang="ts">
    import type { Skill } from '@js/skill/skill.js';

    let { skill }: { skill: Skill } = $props();
</script>

<skill-card
    data-primary-tree={skill.primaryTree}
    data-secondary-tree={skill.secondaryTree}
>
    <skill-header>
        <skill-name>
            {#if skill.url}
                <a href={skill.url} target="_blank" rel="noopener">
                    {skill.name}
                </a>
            {:else}
                <span>{skill.name}</span>
            {/if}
        </skill-name>

        {#if skill.hasCost}
            <skill-cost>
                {#if skill.spCost}
                    <span>
                        {#each Array(skill.spCost) as _}
                            <source-icon></source-icon>
                        {/each}
                    </span>
                {/if}

                {#if skill.apCost}
                    <span>
                        {#each Array(skill.apCost) as _}
                            <ap-icon></ap-icon>
                        {/each}
                    </span>
                {/if}
            </skill-cost>
        {/if}
    </skill-header>

    <skill-effect>{@html skill.effect}</skill-effect>

    <skill-requirements>
        {#if skill.secondaryTree}
            <req-badge data-tree={skill.secondaryTree}>
                {skill.secondaryTree} {skill.investment}
            </req-badge>
        {/if}
        <req-badge data-tree={skill.primaryTree}>
            {skill.primaryTree} {skill.investment}
        </req-badge>
    </skill-requirements>

    <skill-metadata>
        <skill-range>{skill.range}</skill-range>
        <skill-cooldown>{skill.cooldown}</skill-cooldown>
    </skill-metadata>
</skill-card>
