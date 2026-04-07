import { SvelteSet } from 'svelte/reactivity';

import * as urlState from '@js/url-state.js';

export class Filter {
    primary = $state(null);
    any = new SvelteSet();

    singleClass = $state(null);
    source = $state(null);

    sorting = $state([]);

    constructor() {
        const fromURL = urlState.load();

        this.primary = fromURL.primary;
        this.singleClass = fromURL.singleClass;
        this.source = fromURL.source;
        this.any = new SvelteSet(fromURL.any);

        $effect(this.save);
    }

    save = () => urlState.save(this);

    clear = () => {
        this.primary = null;
        this.any.clear();
    };

    isActive = () => {
        return this.primary || !!this.any.size;
    };

    has = (tree) => {
        return [this.primary, ...this.any].includes(tree);
    };
}

export class Settings {
    filter = new Filter();
}
