function skill(name, trees) {
    const requirements = {};
    trees.forEach(t => { requirements[t] = 1; });
    return { name, requirements, ap_cost: 1, sp_cost: 0, effect: '' };
}

module.exports = { skill };
