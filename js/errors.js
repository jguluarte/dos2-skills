export class SkillValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SkillValidationError';
    }
}

export class MissingNameError extends SkillValidationError {
    constructor() {
        super('Skill requires a name');
        this.name = 'MissingNameError';
    }
}

export class MissingRequirementsError extends SkillValidationError {
    constructor(skillName) {
        super(`Skill "${skillName}" requires non-empty requirements`);
        this.name = 'MissingRequirementsError';
    }
}

export class MissingEffectError extends SkillValidationError {
    constructor(skillName) {
        super(`Skill "${skillName}" requires an effect`);
        this.name = 'MissingEffectError';
    }
}

export class UnknownTreeError extends SkillValidationError {
    constructor(skillName, tree) {
        super(`Skill "${skillName}": unknown tree "${tree}"`);
        this.name = 'UnknownTreeError';
        this.tree = tree;
    }
}

export class PrerequisiteError extends SkillValidationError {
    constructor(skillName, tree, level) {
        const msg = `Skill "${skillName}": level must be`
            + ` a positive integer, got ${level}`
            + ` for "${tree}"`;
        super(msg);
        this.name = 'PrerequisiteError';
        this.tree = tree;
        this.level = level;
    }
}
