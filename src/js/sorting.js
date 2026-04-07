class Sortable {
    constructor(filter) {
        this.filter = filter;
    }

    shouldSkip = () => false;
}

export class Investment extends Sortable {
    label = "Investment";
    sort = (a, b) => a.investment - b.investment;
}

export class Name extends Sortable {
    label = "Name";
    sort = (a, b) => a.name.localeCompare(b.name);
}

export class SearchMatch extends Sortable {
    get label() {
        return this.filter.isActive()
            ? "Search Match"
            : "Primary Tree";
    }

    sort = (a, b) => {
        const aSearchIdentity = this.treeFor(a);
        const bSearchIdentity = this.treeFor(b);

        return aSearchIdentity.localeCompare(bSearchIdentity);
    };

    treeFor = (s) => {
        if (!this.filter.isActive()) return s.primaryTree;

        const searchTerms = [this.filter.primary, ...this.filter.any ];

        // use the primary if it matches
        if ( searchTerms.includes(s.primaryTree) ) {
            return s.primaryTree;
        }

        // Otherwise find the first alphabetical matching tree
        return searchTerms.sort().find( (t) => t && s.has(t) );
    };
}

export class SecondaryTree extends Sortable {
    label = "Secondary Tree";
    sort = (a, b) => {
        return this.filter.isActive()
            ? this.sortOtherTree(a, b)
            : this.noFilter(a, b);
    };

    sortOtherTree = (a, b) => {
        const otherTree = (t) => t !== this.filter.primary;

        const aTree = a.trees.find(otherTree) ?? a.secondaryTree ?? '';
        const bTree = b.trees.find(otherTree) ?? b.secondaryTree ?? '';

        return aTree.localeCompare(bTree);
    };

    noFilter = (a, b) => {
        return (a.secondaryTree ?? '').localeCompare(b.secondaryTree ?? '');
    };
}

export class IsDual extends Sortable {
    label = "Is Dual-Class";
    sort = (a, b) => {
        const aDual = a.secondaryTree ? 1 : 0;
        const bDual = b.secondaryTree ? 1 : 0;

        return aDual - bDual;
    };
}

/*

# All skills
- primaryTree
- investment
- isDual
- secondaryTree
- name

# With Primary (has(tree))
- investment
- isDual
- "otherTree"
- name

# With multiple in `any`
- Search Match
- investment
- isDual
- "otherTree"
- name

I think "secondaryTree" === "otherTree"

It is the "other" when there are no search terms. And when there are, then its
whatever the non-matching || secondaryTree (in the event both trees are in the
search query).

I __might__ be able to reuse `SearchMatch` for `primaryTree` when no other
filters are applied. maybe? not sure if it is appropriate or not. the shouldSkip
idea might work....but might be clunky.

*/
