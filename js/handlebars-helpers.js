export function registerHelpers(Handlebars) {
    Handlebars.registerHelper('lowercase', str => str.toLowerCase());
}
