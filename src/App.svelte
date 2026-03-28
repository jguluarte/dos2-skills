<script lang="ts">
    import jsyaml from 'js-yaml';
    import { Skill } from '@js/skill/skill.js';
    import { SUMMONING } from '@constants';
    import skillsYaml from '@data/skills.yaml?raw';
    import FilterBar from './components/FilterBar.svelte';
    import SkillCard from './components/SkillCard.svelte';

    const wantsSummoning = (p, s) => [p, ...s].includes(SUMMONING);

    const allSkills = (jsyaml.load(skillsYaml) as Record<string, unknown>[])
        .map((raw) => Skill.fromYAML(raw));


    let primary = $state<string | null>(null);
    let secondaryFilters = $state<Set<string>>(new Set());

    let filteredSkills = $derived.by(() => {
        if (!primary && secondaryFilters.size === 0) return allSkills;

        let results = allSkills;

        if (primary) {
            results = results.filter((s) => s.has(primary));
        }

        if (secondaryFilters.size > 0) {
            results = results.filter((s) => s.any(secondaryFilters));
        }

        if (!wantsSummoning(primary, secondaryFilters)) {
            results = results.filter((s) => s.primaryTree !== SUMMONING);
        }

        return results;
    });
</script>

<FilterBar bind:primary bind:secondaryFilters />

<div class="container">
    <div id="skills-container">
        {#each filteredSkills as skill (skill.name)}
            <SkillCard {skill} />
        {/each}
    </div>

    {#if filteredSkills.length === 0}
        <div class="no-results">
            No skills found matching your filters.
        </div>
    {/if}
</div>
