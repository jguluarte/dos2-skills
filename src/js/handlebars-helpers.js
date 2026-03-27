export function registerHelpers(Handlebars) {
    Handlebars.registerHelper('lowercase', (str) => str.toLowerCase());

    Handlebars.registerHelper('repeat', (n, options) => {
        let result = '';
        for (let i = 0; i < n; i++) result += options.fn(i);
        return result;
    });
}
