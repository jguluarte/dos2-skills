#!/usr/bin/env python3
import json

# Read the skills.json file
with open('data/skills.json', 'r') as f:
    skills = json.load(f)

# Clean each skill
cleaned_skills = []
for skill in skills:
    cleaned = {
        "name": skill["name"],
        "requirements": skill["requirements"],
        "wiki_url": skill["wiki_url"]
    }

    # Clean ability_details
    details = {
        "ap_cost": skill["ability_details"]["ap_cost"],
        "sp_cost": skill["ability_details"]["sp_cost"],
        "range": skill["ability_details"]["range"],
        "cooldown": skill["ability_details"]["cooldown"],
        "effect": skill["ability_details"]["effect"]
    }

    # Only include special_terms if it has values
    if skill["ability_details"].get("special_terms") and len(skill["ability_details"]["special_terms"]) > 0:
        details["special_terms"] = skill["ability_details"]["special_terms"]

    cleaned["ability_details"] = details
    cleaned_skills.append(cleaned)

# Write back to file with proper formatting
with open('data/skills.json', 'w') as f:
    json.dump(cleaned_skills, f, indent=2)
    f.write('\n')

print('✓ Cleaned skills.json')
print('  - Removed: source_cost, description, found_on_page, has_wiki_page')
print('  - Removed: empty special_terms arrays')
print(f'  - Processed {len(cleaned_skills)} skills')
