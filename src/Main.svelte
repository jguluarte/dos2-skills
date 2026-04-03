<script>
    import jsyaml from 'js-yaml';
    import { Skill } from '@js/skill/skill.js';
    import {
        defaultSort,
        // filterSkills,
    } from '@js/filter.js';
    // import * as urlState from '@js/url-state.js';
    import skillsYaml from '@data/skills.yaml?raw';
    import SkillCard from '@components/SkillCard.svelte';

    // ////////////////
    // EVERYTHING BELOW IS FOR SURE IN USE
    // ////////////////

    import { Settings } from '@js/settings.svelte.js';
    import Heading from './components/Heading.svelte';

    import { PrimaryFilter, AnyFilter, SummoningFilter } from '@js/strategy.js';

    const settings = new Settings();

    const allSkills = defaultSort(
        jsyaml.load(skillsYaml).map(Skill.fromYAML)
    );

    const strategies = [
        new SummoningFilter(settings.filter),
        new PrimaryFilter(settings.filter),
        new AnyFilter(settings.filter),
    ];

    let filteredSkills = $derived(strategies.reduce(
        (skills, strategy) => strategy.apply(skills), allSkills
    ));

    $effect(() => {
        filteredSkills;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

</script>

<Heading {settings} />

<div class="container">

    {#if filteredSkills.length > 0}
        {#each filteredSkills as skill (skill.name)}
            <SkillCard {skill} />
        {/each}
    {:else}
        <div class="no-results">
            No skills found matching your filters.
        </div>
    {/if}

</div>
