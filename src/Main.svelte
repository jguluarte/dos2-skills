<script>
    import jsyaml from 'js-yaml';
    import { Skill } from '@js/skill/skill.js';
    import { defaultSort, filterSkills } from '@js/filter.js';
    // import * as urlState from '@js/url-state.js';
    // import { Settings } from '@js/settings.svelte.js';
    import skillsYaml from '@data/skills.yaml?raw';
    import SkillCard from './components/SkillCard.svelte';

    import Heading from './components/Heading.svelte';
    import SettingsPanel from './components/Settings.svelte';

    const filteredSkills = defaultSort(
        jsyaml.load(skillsYaml).map(Skill.fromYAML)
    );


     function open_settings() {
        console.log("we gonna open settings nao");
     }

</script>

<action-bar>
    <Heading onclick={open_settings} />

    <!-- <SettingsPanel /> -->
</action-bar>

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
