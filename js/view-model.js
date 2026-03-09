export class ViewModel {
    constructor(source) {
        this._source = source;
        return new Proxy(this, {
            get(target, prop) {
                if (prop in target) return target[prop];
                return source[prop];
            },
            has(target, prop) {
                return prop in target || prop in source;
            },
        });
    }
}
