function skill(name, trees) {
    const requirements = {};
    trees.forEach(t => { requirements[t] = 1; });
    return { name, requirements };
}

module.exports = { skill };
