<script>
    import jsyaml from 'js-yaml';
    import skillsYaml from '@data/skills.yaml?raw';

    import { Skill } from '@js/skill/skill.js';
    import { Settings } from '@js/settings.svelte.js';

    import Heading from './components/Heading.svelte';
    import SkillCard from '@components/SkillCard.svelte';

    import {
        PrimaryFilter, AnyFilter, SummoningFilter, SingleClassFilter,
        SourceFilter,
    } from '@js/strategy.js';

    const settings = new Settings();

    const allSkills = jsyaml.load(skillsYaml).map(Skill.fromYAML);

    const filters = [
        SummoningFilter, PrimaryFilter, AnyFilter, SingleClassFilter,
        SourceFilter,
    ];

    const strategies = filters.map( (f) => new f(settings.filter) );

    let filteredSkills = $derived(
        strategies.reduce(
            (skills, strategy) => strategy.apply(skills),
            allSkills
        )
    );

    let sortedSkills = $derived(
        [...filteredSkills].sort((a, b) =>
            settings.filter.sorting.map(
                (fn) => fn(a, b)
            ).find((r) => !!r) ?? 0
        )
    );

    let firstTime = true;
    $effect(() => {
        sortedSkills;
        if (!firstTime) window.scrollTo({ top: 0, behavior: 'smooth' });
        firstTime = false;
    });

</script>

<Heading filter={settings.filter} />

<div class="container">

    {#if sortedSkills.length > 0}
        {#each sortedSkills as skill (skill.name)}
            <SkillCard {skill} />
        {/each}
    {:else}
        <!-- The queen has been eliminated. She must sashay away. -->
        <div class="no-results">
            No skills found. Your filters are <em>not</em> reading &ldquo;books&rdquo; &mdash;
            they are reading <em>blank pages</em>.
            <br><br>
            <small>Sashay away.</small>
        </div>
    {/if}

</div>
