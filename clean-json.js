const fs = require('fs');

// Read the skills.json file
const skills = JSON.parse(fs.readFileSync('data/skills.json', 'utf8'));

// Clean each skill
const cleanedSkills = skills.map(skill => {
  const cleaned = {
    name: skill.name,
    requirements: skill.requirements,
    has_wiki_page: skill.has_wiki_page,
    wiki_url: skill.wiki_url
  };

  // Clean ability_details
  const details = {};
  details.ap_cost = skill.ability_details.ap_cost;
  details.sp_cost = skill.ability_details.sp_cost;
  details.range = skill.ability_details.range;
  details.cooldown = skill.ability_details.cooldown;
  details.effect = skill.ability_details.effect;

  // Only include special_terms if it has values
  if (skill.ability_details.special_terms && skill.ability_details.special_terms.length > 0) {
    details.special_terms = skill.ability_details.special_terms;
  }

  cleaned.ability_details = details;

  return cleaned;
});

// Write back to file with proper formatting
fs.writeFileSync('data/skills.json', JSON.stringify(cleanedSkills, null, 2) + '\n');

console.log('✓ Cleaned skills.json');
console.log('  - Removed: source_cost, description, found_on_page');
console.log('  - Removed: empty special_terms arrays');
console.log(`  - Processed ${cleanedSkills.length} skills`);
