import type Handlebars from 'handlebars';

type HandlebarsStatic = typeof Handlebars;

export function registerHelpers(
    hbs: HandlebarsStatic,
): void {
    hbs.registerHelper(
        'lowercase',
        (str: string) => str.toLowerCase(),
    );
}
