export function viewModel(source, overrides) {
    return new Proxy(source, {
        get(target, prop) {
            if (prop in overrides) return overrides[prop](target);
            return target[prop];
        },
        has(target, prop) {
            return prop in overrides || prop in target;
        },
    });
}
