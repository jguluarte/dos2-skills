export class SkillValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SkillValidationError';
    }
}

export class MissingNameError
    extends SkillValidationError {
    constructor() {
        super('Skill requires a name');
        this.name = 'MissingNameError';
    }
}

export class MissingRequirementsError
    extends SkillValidationError {
    constructor(skillName: string) {
        super(
            `Skill "${skillName}" requires`
            + ' non-empty requirements',
        );
        this.name = 'MissingRequirementsError';
    }
}

export class MissingEffectError
    extends SkillValidationError {
    constructor(skillName: string) {
        super(
            `Skill "${skillName}" requires an effect`,
        );
        this.name = 'MissingEffectError';
    }
}

export class UnknownTreeError
    extends SkillValidationError {
    tree: string;
    constructor(skillName: string, tree: string) {
        super(
            `Skill "${skillName}": `
            + `unknown tree "${tree}"`,
        );
        this.name = 'UnknownTreeError';
        this.tree = tree;
    }
}

export class MissingPrimaryTreeError
    extends SkillValidationError {
    constructor(skillName: string) {
        super(
            `Skill "${skillName}"`
            + ' requires a primary_tree',
        );
        this.name = 'MissingPrimaryTreeError';
    }
}

export class InvalidPrimaryTreeError
    extends SkillValidationError {
    tree: string;
    constructor(skillName: string, tree: string) {
        super(
            `Skill "${skillName}":`
            + ` primary_tree "${tree}"`
            + ' is not in requirements',
        );
        this.name = 'InvalidPrimaryTreeError';
        this.tree = tree;
    }
}

export class PrerequisiteError
    extends SkillValidationError {
    tree: string;
    level: number;
    constructor(
        skillName: string,
        tree: string,
        level: number,
    ) {
        const msg = `Skill "${skillName}": level must be`
            + ` a positive integer, got ${level}`
            + ` for "${tree}"`;
        super(msg);
        this.name = 'PrerequisiteError';
        this.tree = tree;
        this.level = level;
    }
}
