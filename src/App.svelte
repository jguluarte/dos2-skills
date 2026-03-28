<script>
    import jsyaml from 'js-yaml';
    import { Skill } from '@js/skill/skill.js';
    import { SUMMONING } from '@constants';
    import * as urlState from '@js/url-state.js';
    import skillsYaml from '@data/skills.yaml?raw';
    import FilterBar from './components/FilterBar.svelte';
    import SkillCard from './components/SkillCard.svelte';

    const wantsSummoning = (p, s) => [p, ...s].includes(SUMMONING);

    const allSkills = jsyaml.load(skillsYaml)
        .map(Skill.fromYAML)
        .sort((a, b) =>
            a.primaryTree.localeCompare(b.primaryTree)
            || a.investment - b.investment
            || (a.secondaryTree ?? '').localeCompare(b.secondaryTree ?? '')
        );

    const saved = urlState.load();
    let primary = $state(saved.primary);
    let secondaryFilters = $state(saved.filters);

    $effect( () => urlState.save(primary, secondaryFilters) );

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
