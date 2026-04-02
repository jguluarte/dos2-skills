import { SvelteSet } from 'svelte/reactivity';

export class Filter {
    primary = $state(null);
    any = new SvelteSet();

    clear = () => {
        this.primary = null;
        this.any.clear();
    };

    isActive = () => {
        return this.primary || !!this.any.size;
    };
}

export class Settings {
    filter = new Filter();

    clear = () => {
        this.filter.clear();
    };
}
