export class Skill {
    constructor(raw) {
        this.name = raw.name;
        this.requirements = raw.requirements;
        this.trees = Object.keys(raw.requirements).sort();
        this.apCost = raw.ap_cost;
        this.spCost = raw.sp_cost;
        this.range = raw.range ?? null;
        this.cooldown = raw.cooldown ?? null;
        this.effect = raw.effect;
        this.wikiUrl = raw.wiki_url ?? null;
    }
}
