import { describe, it, expect } from 'vitest';
import jsyaml from 'js-yaml';

import { Schema } from '@js/skill';
import skillsYaml from '@data/skills.yaml?raw';

const skills = jsyaml.load(skillsYaml);

describe("YAML file validation", () => {
    it('Data is stored as an array', () => {
        expect(Array.isArray(skills)).toBe(true);
    });

    it("Skills are found in the file", () => {
        expect(skills.length).toBeGreaterThan(0);
    });

    it('No duplicate names found', () => {
        const names = skills.map((s) => s.name);
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);
        expect(dupes).toEqual([]);
    });
});

describe("skill validation", () => {
    it.each(skills)("$name", (skill) => {
        Schema.parse(skill);
    });
});
