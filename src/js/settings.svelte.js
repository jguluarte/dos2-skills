import { SvelteSet } from 'svelte/reactivity';

import * as urlState from '@js/url-state.js';

export class Filter {
    primary = $state(null);
    any = new SvelteSet();

    constructor() {
        const { primary, filters } = urlState.load();
        this.primary = primary;
        this.any = new SvelteSet(filters);

        $effect(this.save);
    }

    save = () => urlState.save(this.primary, this.any);

    clear = () => {
        this.primary = null;
        this.any.clear();
    };

    isActive = () => {
        return this.primary || !!this.any.size;
    };
}
