<script lang="ts">
    import jsyaml from 'js-yaml';
    import { Skill } from '@js/skill/skill.js';
    import skillsYaml from '@data/skills.yaml?raw';
    import SkillCard from './components/SkillCard.svelte';

    const skills = (jsyaml.load(skillsYaml) as Record<string, unknown>[])
        .map((raw) => Skill.fromYAML(raw));
</script>

<div class="container">
    <div id="skills-container">
        {#each skills as skill (skill.name)}
            <SkillCard {skill} />
        {/each}
    </div>
</div>
