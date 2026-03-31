import { SvelteSet } from 'svelte/reactivity';

class Filter {
    primary = $state(null);
    any = new SvelteSet();

    clear = () => {
        this.primary = null;
        this.any.clear();
    };
}

export class Settings {
    filter = new Filter();

    clear = () => {
        this.filter.clear();
    };
}
