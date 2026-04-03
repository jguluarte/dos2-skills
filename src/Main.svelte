<script>
    import jsyaml from 'js-yaml';
    import skillsYaml from '@data/skills.yaml?raw';

    import { Skill } from '@js/skill/skill.js';
    import { defaultSort } from '@js/filter.js';
    import { Settings } from '@js/settings.svelte.js';

    import Heading from './components/Heading.svelte';
    import SkillCard from '@components/SkillCard.svelte';

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

    let firstTime = true;
    $effect(() => {
        filteredSkills;
        if (!firstTime) window.scrollTo({ top: 0, behavior: 'smooth' });
        firstTime = false;
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
