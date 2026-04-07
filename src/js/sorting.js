class Sortable {
    constructor(filter) {
        this.filter = filter;
    }
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

    treeFor = (skill) => {
        if (!this.filter.isActive()) return skill.primaryTree;

        const searchTerms = [this.filter.primary, ...this.filter.any];

        if (searchTerms.includes(skill.primaryTree)) {
            return skill.primaryTree;
        }

        return searchTerms.toSorted().find(
            (term) => term && skill.has(term)
        );
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
        const isOther = (tree) => tree !== this.filter.primary;

        const aTree = a.trees.find(isOther) ?? a.secondaryTree ?? '';
        const bTree = b.trees.find(isOther) ?? b.secondaryTree ?? '';

        return aTree.localeCompare(bTree);
    };

    noFilter = (a, b) => {
        const aTree = a.secondaryTree ?? '';
        const bTree = b.secondaryTree ?? '';

        if (aTree && !bTree) return -1;
        if (!aTree && bTree) return 1;
        return aTree.localeCompare(bTree);
    };
}

export class SingleClass extends Sortable {
    label = "Single Class";
    sort = (a, b) => {
        const aDual = a.secondaryTree ? 1 : 0;
        const bDual = b.secondaryTree ? 1 : 0;

        return aDual - bDual;
    };
}

export const DEFAULT_SORT = [
    SearchMatch, Investment, SingleClass, SecondaryTree, Name,
];
