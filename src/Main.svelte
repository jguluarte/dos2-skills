<script>
    import jsyaml from 'js-yaml';
    import { Skill } from '@js/skill/skill.js';
    import {
        defaultSort,
        // filterSkills,
    } from '@js/filter.js';
    // import * as urlState from '@js/url-state.js';
    import skillsYaml from '@data/skills.yaml?raw';
    import SkillCard from './components/SkillCard.svelte';

    // ////////////////
    // EVERYTHING BELOW IS FOR SURE IN USE
    // ////////////////

    import { Filter } from '@js/settings.svelte.js';

    import Heading from './components/Heading.svelte';
    import SettingsPanel from './components/Settings.svelte';

    const filter = new Filter();

    const filteredSkills = defaultSort(
        jsyaml.load(skillsYaml).map(Skill.fromYAML)
    );

    let open = $state(false);
    const toggle = () => open = !open;

</script>

<action-bar>
    <Heading onclick={toggle} {filter}/>
    <SettingsPanel bind:open {filter} />
</action-bar>

<overlay class:open role="presentation" onclick={toggle}></overlay>

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
