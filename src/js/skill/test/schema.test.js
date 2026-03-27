import { ZodError } from 'zod';
import { fake } from 'zod-schema-faker/v4';
import { describe, it, expect, beforeEach } from 'vitest';

// FIXME this import reads wrong
import { Schema } from '@js/skill';
import { SUMMONING, PYROKINETIC, WARFARE } from '@constants';

describe("skill schema", () => {
    let skill;
    beforeEach(() => {
        skill = fake(Schema);
    });

    it("throws with invalid primary/secondary combinations", () => {
        skill.primary_tree   = SUMMONING;
        skill.secondary_tree = WARFARE;

        expect( () => Schema.parse(skill) ).toThrow(ZodError);
    });

    it("allows valid primary/secondary combinations", () => {
        skill.primary_tree   = SUMMONING;
        skill.secondary_tree = PYROKINETIC;

        Schema.parse(skill);
    });
});
