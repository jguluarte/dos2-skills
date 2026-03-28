<script>
    import jsyaml from 'js-yaml';
    import { Skill } from '@js/skill/skill.js';
    import { filterSkills } from '@js/filter.js';
    import * as urlState from '@js/url-state.js';
    import skillsYaml from '@data/skills.yaml?raw';
    import SkillCard from './components/SkillCard.svelte';
    import FilterBar from './components/FilterBar.svelte';

    const allSkills = jsyaml.load(skillsYaml)
        .map(Skill.fromYAML)
        .sort((a, b) =>
            a.primaryTree.localeCompare(b.primaryTree)
            || (a.secondaryTree ?? '').localeCompare(b.secondaryTree ?? '')
            || a.investment - b.investment
        );

    const saved = urlState.load();
    let primary = $state(saved.primary);
    let filters = $state(saved.filters);

    $effect( () => urlState.save(primary, filters) );

    let filteredSkills = $derived(
        filterSkills(allSkills, primary, filters)
    );
</script>

<FilterBar bind:primary bind:filters />

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
