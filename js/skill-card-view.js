export function createSkillCard(skill, category) {
    const card = document.createElement('skill-card');
    card.dataset.name = skill.name.toLowerCase();
    card.dataset.trees = skill.trees.join(',');

    const nameHTML = skill.url
        ? `<a href="${skill.url}" target="_blank" rel="noopener">
         ${skill.name}
       </a>`
        : `<span>${skill.name}</span>`;

    const nameElement = `
        <skill-name data-primary-tree="${category.toLowerCase()}"
                    data-secondary-tree="${skill.secondaryTree.toLowerCase()}"
        >${nameHTML}</skill-name>`;

    const icons = [];

    if (skill.spCost) {
        icons.push(`<span>${
            '<source-icon></source-icon>'.repeat(skill.spCost)
        }</span>`);
    }

    if (skill.apCost) {
        icons.push(`<span>${
            '<ap-icon></ap-icon>'.repeat(skill.apCost)
        }</span>`);
    }

    let costHTML = '';
    if (icons.length > 0) {
        costHTML = `<skill-cost>${icons.join('')}</skill-cost>`;
    }

    const effectHTML = `
        <skill-effect>
            ${skill.effect}
        </skill-effect>`;

    const reqBadges = Object.entries(skill.requirements)
        .sort(([treeA], [treeB]) => {
            if (treeA === category) return 1;
            if (treeB === category) return -1;
            return 0;
        })
        .map(([tree, level]) => {
            return `
                <req-badge data-tree="${tree.toLowerCase()}">
                    ${tree} ${level}
                </req-badge>`;
        })
        .join('');

    const requirementsHTML = reqBadges ?
        `<skill-requirements>${reqBadges}</skill-requirements>` : '';

    let statsHTML = '';
    if (skill.range || skill.cooldown) {
        const rangeHTML = skill.range ? `Range: ${skill.range}` : '';
        const cooldownHTML = skill.cooldown ?
            `Cooldown: ${skill.cooldown}` : '';

        statsHTML = `
            <skill-stats>
                <div>${rangeHTML}</div>
                <div>${cooldownHTML}</div>
            </skill-stats>
        `;
    }

    card.innerHTML = `
        <skill-header>
            ${nameElement}
            ${costHTML}
        </skill-header>
        ${effectHTML}
        ${requirementsHTML}
        ${statsHTML}
    `;

    return card;
}
