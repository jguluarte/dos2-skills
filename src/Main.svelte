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

    // If you can't love your skill build, how in the hell
    // are you gonna love somebody else's?
    const emptyQuips = [
        "No skills found. Sashay away.",
        "Your filters said: I'd like to keep it on, please. "
        + "The skill list said: Sashay away.",
        "Condolences. You have been Purged of all results.",
        "No skills on the main stage tonight. "
        + "Adjust your filters and don't f*ck it up.",
        "This build has no Source Points and no charisma. "
        + "I'm sorry my dear, you are up for elimination.",
    ];

    let emptyQuip = $derived(
        emptyQuips[
            Math.abs(
                [...JSON.stringify({
                    p: settings.filter.primary,
                    a: [...(settings.filter.any ?? [])],
                })].reduce((h, c) => h + c.charCodeAt(0), 0)
            ) % emptyQuips.length
        ]
    );

    // -- The Library is OPEN, darlings --
    // Type "sashay" anywhere to trigger the runway.
    let sashayBuffer = $state('');
    function onKeydown(e) {
        if (e.target.tagName === 'INPUT') return;
        sashayBuffer += e.key.toLowerCase();
        if (sashayBuffer.length > 20) {
            sashayBuffer = sashayBuffer.slice(-20);
        }
        if (sashayBuffer.endsWith('sashay')) {
            sashayBuffer = '';
            triggerRunway();
        }
    }

    let runway = $state(false);
    function triggerRunway() {
        if (runway) return;
        runway = true;

        // eslint-disable-next-line no-console
        console.log(
            '%c Gentlemen, start your Source Points. '
            + 'And may the best Godwoken... win. ',
            'background: linear-gradient(90deg, #e74c3c, '
            + '#e67e22, #f1c40f, #2ecc71, #3498db, #9b59b6);'
            + ' color: #fff; font-size: 14px;'
            + ' font-weight: bold;'
            + ' padding: 8px 16px; border-radius: 4px;'
        );

        setTimeout(() => runway = false, 1600);
    }

</script>

<svelte:window onkeydown={onKeydown} />

<Heading filter={settings.filter} />

<div class="container" class:runway>

    {#if sortedSkills.length > 0}
        {#each sortedSkills as skill (skill.name)}
            <SkillCard {skill} />
        {/each}
    {:else}
        <div class="no-results">
            {emptyQuip}
        </div>
    {/if}

</div>
