#!/usr/bin/env python3
"""
Scrape DOS2 skill data from the fextralife wiki.

Hits the 10 school list pages, parses the skill tables, and writes
YAML to skills-wiki.yaml.
"""

import re
import sys
import time

import requests
import yaml
from bs4 import BeautifulSoup

BASE_URL = 'https://divinityoriginalsin2.wiki.fextralife.com'

SCHOOL_PAGES = [
    'Pyrokinetic+Skills',
    'Aerotheurge+Skills',
    'Geomancer+Skills',
    'Hydrosophist+Skills',
    'Warfare+Skills',
    'Huntsman+Skills',
    'Scoundrel+Skills',
    'Polymorph+Skills',
    'Necromancer+Skills',
    'Summoning+Skills',
]

# Map icon filename fragments to canonical tree names
ICON_TO_TREE = {
    'pyrokinetic':  'Pyrokinetic',
    'aerotheurge':  'Aerotheurge',
    'geomancer':    'Geomancer',
    'hydrosophist': 'Hydrosophist',
    'warfare':      'Warfare',
    'huntsman':     'Huntsman',
    'hunstman':     'Huntsman',  # wiki typo in icon filename
    'scoundrel':    'Scoundrel',
    'polymorph':    'Polymorph',
    'necromancer':  'Necromancer',
    'summoning':    'Summoning',
}

ELEMENTAL_TREES = {'Pyrokinetic', 'Aerotheurge', 'Geomancer', 'Hydrosophist'}

# Page name -> canonical tree name (for fallback identification)
PAGE_TO_TREE = {
    'Pyrokinetic+Skills':  'Pyrokinetic',
    'Aerotheurge+Skills':  'Aerotheurge',
    'Geomancer+Skills':    'Geomancer',
    'Hydrosophist+Skills': 'Hydrosophist',
    'Warfare+Skills':      'Warfare',
    'Huntsman+Skills':     'Huntsman',
    'Scoundrel+Skills':    'Scoundrel',
    'Polymorph+Skills':    'Polymorph',
    'Necromancer+Skills':  'Necromancer',
    'Summoning+Skills':    'Summoning',
}


def fetch_page(page):
    """Fetch a wiki page and return BeautifulSoup."""
    url = f'{BASE_URL}/{page}'
    print(f'  Fetching {url}')
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, 'html.parser')


def parse_tree_from_icon(img):
    """Extract tree name from an icon img tag's src attribute."""
    src = img.get('src', '')
    alt = img.get('alt', '')
    combined = (src + ' ' + alt).lower()

    for fragment, tree in ICON_TO_TREE.items():
        if fragment in combined:
            return tree
    return None


def parse_requirements(cell):
    """
    Parse the Req cell to extract school(s) and investment level.

    Returns list of (tree_name, level) tuples.
    """
    reqs = []
    imgs = cell.find_all('img')

    # Get the full text content to find numbers near icons
    text = cell.get_text(separator=' ').strip()

    for img in imgs:
        tree = parse_tree_from_icon(img)
        if not tree:
            continue

        # Find the number following this icon
        # The number is typically right after the img in the HTML
        next_sib = img.next_sibling
        level = None
        if next_sib and isinstance(next_sib, str):
            match = re.search(r'(\d+)', next_sib)
            if match:
                level = int(match.group(1))

        if level is not None and level > 0:
            reqs.append((tree, level))

    # Fallback: if we found icons but no levels, try parsing numbers from text
    if not reqs and imgs:
        numbers = re.findall(r'(\d+)', text)
        trees = [parse_tree_from_icon(img) for img in imgs]
        trees = [t for t in trees if t]
        for i, tree in enumerate(trees):
            level = int(numbers[i]) if i < len(numbers) else 1
            if level > 0:
                reqs.append((tree, level))

    return reqs


def parse_ap_cost(cell):
    """Parse AP cost from cell. AP icons encode cost in filename."""
    img = cell.find('img')
    if img:
        src = img.get('src', '')
        # AP.png = 1, AP2.png = 2, AP3.png = 3, etc.
        match = re.search(r'AP(\d*)', src, re.IGNORECASE)
        if match:
            return int(match.group(1)) if match.group(1) else 1

    text = cell.get_text(strip=True)
    if text and text not in ('-', '—', '\\-'):
        match = re.search(r'(\d+)', text)
        if match:
            return int(match.group(1))
    return 0


def parse_sp_cost(cell):
    """Parse SP cost from cell. SP icons encode cost in filename."""
    img = cell.find('img')
    if img:
        src = img.get('src', '')
        match = re.search(r'SP(\d*)', src, re.IGNORECASE)
        if match:
            return int(match.group(1)) if match.group(1) else 1

    text = cell.get_text(strip=True)
    if text and text not in ('-', '—', '\\-'):
        match = re.search(r'(\d+)', text)
        if match:
            return int(match.group(1))
    return 0


def parse_number(cell, default=0):
    """Parse a plain number from a cell."""
    text = cell.get_text(strip=True)
    if text and text not in ('-', '—', '\\-'):
        match = re.search(r'(\d+)', text)
        if match:
            return int(match.group(1))
    return default


def parse_range(cell):
    """Parse range from a cell. Returns string like '13m', 'Self', etc."""
    text = cell.get_text(strip=True)
    if not text or text in ('-', '—', '\\-', '--'):
        return None
    # Normalize wiki range values to match our schema
    # Schema expects: Self, PB AoE, All allies, or \d+m
    text = text.replace('\u2013', '-').replace('\u2014', '-')
    return text


def parse_description(cell):
    """Extract description text, cleaning up wiki markup."""
    text = cell.get_text(separator=' ').strip()
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)
    return text if text and text not in ('-', '—', '\\-') else None


def determine_primary_secondary(reqs, page_tree):
    """
    Given requirement tuples and the page's tree, determine primary
    and secondary trees.

    Cross-class skills only appear on one school page, so the first
    icon in the Req column is the primary tree. Trust the page order.
    """
    if len(reqs) == 0:
        return page_tree, None, 1

    if len(reqs) == 1:
        return reqs[0][0], None, reqs[0][1]

    tree_a, level_a = reqs[0]
    tree_b, _level_b = reqs[1]

    return tree_a, tree_b, level_a


def find_skill_table(soup):
    """Find the main skill table on the page."""
    # Look for table with class 'searchable' or 'wiki_table'
    table = soup.find('table', class_='searchable')
    if table:
        return table

    # Fallback: find the largest table
    tables = soup.find_all('table')
    if tables:
        return max(tables, key=lambda t: len(t.find_all('tr')))
    return None


def detect_columns(header_row):
    """
    Detect column indices from the header row.
    Returns a dict mapping field names to column indices.
    """
    columns = {}
    cells = header_row.find_all(['th', 'td'])

    for i, cell in enumerate(cells):
        text = cell.get_text(strip=True).lower()
        if 'name' in text or i == 0:
            columns.setdefault('name', i)
        elif text in ('req', 'requirement', 'requirements'):
            columns['req'] = i
        elif text in ('mem', 'memory'):
            columns['mem'] = i
        elif text == 'ap':
            columns['ap'] = i
        elif text == 'sp':
            columns['sp'] = i
        elif text in ('cd', 'cooldown'):
            columns['cd'] = i
        elif text in ('res', 'resistance'):
            columns['res'] = i
        elif text == 'scale':
            columns['scale'] = i
        elif text == 'range':
            columns['range'] = i
        elif text in ('description', 'desc'):
            columns['description'] = i
        elif text == 'effect':
            columns['effect'] = i

    return columns


def parse_skill_name_and_url(cell):
    """Extract skill name and URL from the name cell."""
    link = cell.find('a')
    if link:
        name = link.get_text(strip=True)
        href = link.get('href', '')
        if href.startswith('/'):
            url = BASE_URL + href
        elif href.startswith('http'):
            url = href
        else:
            url = None
        return name, url

    # Fallback: just text
    text = cell.get_text(strip=True)
    return text, None


def scrape_school_page(page):
    """Scrape all skills from a school page. Returns list of skill dicts."""
    page_tree = PAGE_TO_TREE[page]
    soup = fetch_page(page)
    table = find_skill_table(soup)

    if not table:
        print(f'  WARNING: No skill table found on {page}')
        return []

    rows = table.find_all('tr')
    if len(rows) < 2:
        print(f'  WARNING: Table too short on {page}')
        return []

    columns = detect_columns(rows[0])
    print(f'  Detected columns: {columns}')

    skills = []
    for row in rows[1:]:
        cells = row.find_all('td')
        if not cells or len(cells) < 4:
            continue

        # Name and URL
        name_idx = columns.get('name', 0)
        name, url = parse_skill_name_and_url(cells[name_idx])
        if not name:
            continue

        # Requirements
        req_idx = columns.get('req')
        reqs = parse_requirements(cells[req_idx]) if req_idx is not None else []

        # Skip quest skills (level 0)
        if reqs and all(level == 0 for _, level in reqs):
            print(f'  Skipping quest skill: {name}')
            continue

        primary, secondary, investment = determine_primary_secondary(
            reqs, page_tree,
        )

        # AP cost
        ap_idx = columns.get('ap')
        ap_cost = parse_ap_cost(cells[ap_idx]) if ap_idx is not None else 0

        # SP cost
        sp_idx = columns.get('sp')
        sp_cost = parse_sp_cost(cells[sp_idx]) if sp_idx is not None else 0

        # Cooldown
        cd_idx = columns.get('cd')
        cooldown = parse_number(cells[cd_idx]) if cd_idx is not None else 0

        # Range
        range_idx = columns.get('range')
        skill_range = parse_range(cells[range_idx]) if range_idx is not None else None

        # The table has two text columns:
        #   column 'effect' (idx 9) = full skill description
        #   column 'description' (idx 10) = short status/effect summary
        # (yes, the wiki has them backwards from what you'd expect)
        description = None
        effect = None

        effect_idx = columns.get('effect')
        if effect_idx is not None and effect_idx < len(cells):
            description = parse_description(cells[effect_idx])

        desc_idx = columns.get('description')
        if desc_idx is not None and desc_idx < len(cells):
            effect = parse_description(cells[desc_idx])

        skill = {
            'name': name,
            'primary_tree': primary,
            'investment': investment,
        }

        if secondary:
            skill['secondary_tree'] = secondary

        if url:
            skill['url'] = url

        skill['ap_cost'] = ap_cost
        skill['sp_cost'] = sp_cost

        if skill_range:
            skill['range'] = skill_range

        skill['cooldown'] = cooldown

        if description:
            skill['description'] = description

        if effect:
            skill['effect'] = effect

        skills.append(skill)

    return skills


def scrape_detail_page(url):
    """
    Scrape a skill's detail page for all available data.

    Returns a dict with:
      - detail_description: main description with real damage percentages
      - detail_effect: status/effect line from infobox
      - detail_scaling: scaling info (e.g. "Damage is based on your level...")
      - detail_notes: notes and tips section content
      - detail_requirements: requirements section (for cross-checking)
    """
    try:
        soup = fetch_page(url.replace(BASE_URL + '/', ''))
    except Exception as e:
        print(f'    WARNING: Failed to fetch {url}: {e}')
        return None

    result = {}

    # Parse infobox paragraphs
    infobox = soup.find('div', class_='infobox')
    if infobox:
        table = infobox.find('table')
        if table:
            rows = table.find_all('tr')
            if len(rows) >= 2:
                cell = rows[1].find('td')
                if cell:
                    paragraphs = cell.find_all('p')
                    for i, p in enumerate(paragraphs):
                        text = re.sub(r'\s+', ' ',
                                      p.get_text(separator=' ', strip=True))
                        if not text:
                            continue
                        if i == 0:
                            result['detail_description'] = text
                        elif text.startswith('Requires') or 'Memory' in text:
                            result['detail_requirements'] = text
                        elif 'Damage is based' in text or 'based on' in text:
                            result['detail_scaling'] = text
                        elif i == 1:
                            result['detail_effect'] = text

    # Parse "Notes and Tips" section
    for h3 in soup.find_all('h3', class_='bonfire'):
        title = h3.get_text(strip=True)
        if 'Notes and Tips' in title:
            notes = []
            sib = h3.find_next_sibling()
            while sib and sib.name != 'h3':
                if sib.name in ('ul', 'p'):
                    items = sib.find_all('li')
                    if items:
                        for li in items:
                            text = re.sub(
                                r'\s+', ' ',
                                li.get_text(separator=' ', strip=True),
                            )
                            if text:
                                notes.append(text)
                    else:
                        text = re.sub(
                            r'\s+', ' ',
                            sib.get_text(separator=' ', strip=True),
                        )
                        if text:
                            notes.append(text)
                sib = sib.find_next_sibling()
            if notes:
                result['detail_notes'] = notes
            break

    return result if result else None


def deduplicate(skills):
    """
    Deduplicate skills by name, keeping the first occurrence.

    Cross-class skills appear on two school pages. The primary/secondary
    assignment is deterministic (elemental > non-elemental, Summoning > all),
    so both occurrences produce the same result — just drop the dupe.
    """
    seen = set()
    unique = []
    dupes = 0
    for skill in skills:
        if skill['name'] in seen:
            dupes += 1
            continue
        seen.add(skill['name'])
        unique.append(skill)
    return unique, dupes


def yaml_field_order():
    """Return the preferred field ordering for YAML output."""
    return [
        'name', 'primary_tree', 'secondary_tree', 'investment',
        'url', 'ap_cost', 'sp_cost', 'range', 'cooldown',
        'description', 'effect',
        'detail_description', 'detail_effect', 'detail_scaling',
        'detail_requirements', 'detail_notes',
    ]


class OrderedDumper(yaml.SafeDumper):
    """YAML dumper that respects key ordering from OrderedDict-like dicts."""
    pass


def ordered_representer(dumper, data):
    return dumper.represent_mapping('tag:yaml.org,2002:map', data.items())


OrderedDumper.add_representer(dict, ordered_representer)


def order_skill(skill):
    """Reorder skill dict keys to match preferred field order."""
    ordered = {}
    for key in yaml_field_order():
        if key in skill:
            ordered[key] = skill[key]
    # Include any extra keys not in the preferred order
    for key in skill:
        if key not in ordered:
            ordered[key] = skill[key]
    return ordered


def sort_skills(skills):
    """Sort skills by primary_tree, then secondary_tree, then investment, then name."""
    tree_order = [
        'Pyrokinetic', 'Aerotheurge', 'Geomancer', 'Hydrosophist',
        'Warfare', 'Huntsman', 'Scoundrel', 'Polymorph', 'Necromancer',
        'Summoning',
    ]
    tree_rank = {t: i for i, t in enumerate(tree_order)}

    def sort_key(s):
        primary = tree_rank.get(s.get('primary_tree', ''), 99)
        secondary = tree_rank.get(s.get('secondary_tree', ''), -1)
        investment = s.get('investment', 0)
        name = s.get('name', '')
        return (primary, secondary, investment, name)

    return sorted(skills, key=sort_key)


def write_yaml(skills, output_path):
    """Write skills to YAML file."""
    ordered = [order_skill(s) for s in skills]

    with open(output_path, 'w') as f:
        yaml.dump(
            ordered,
            f,
            Dumper=OrderedDumper,
            default_flow_style=False,
            allow_unicode=True,
            width=80,
            sort_keys=False,
        )


def main():
    output_path = 'skills-wiki.yaml'
    delay = 1  # seconds between requests (be polite)

    print('DOS2 Wiki Skill Scraper')
    print('=' * 50)

    all_skills = []
    for i, page in enumerate(SCHOOL_PAGES):
        tree = PAGE_TO_TREE[page]
        print(f'\n[{i + 1}/{len(SCHOOL_PAGES)}] {tree}')

        skills = scrape_school_page(page)
        print(f'  Found {len(skills)} skills')
        all_skills.extend(skills)

        if i < len(SCHOOL_PAGES) - 1:
            time.sleep(delay)

    print(f'\n{"=" * 50}')
    print(f'Total scraped: {len(all_skills)}')

    skills, dupes = deduplicate(all_skills)
    print(f'After dedup:   {len(skills)} (removed {dupes} duplicates)')

    # Phase 2: scrape detail pages for effect descriptions
    print(f'\n{"=" * 50}')
    print('Phase 2: Scraping detail pages for effect text')
    print('=' * 50)

    fetched = 0
    failed = 0
    for i, skill in enumerate(skills):
        url = skill.get('url')
        if not url:
            failed += 1
            continue

        print(f'  [{i + 1}/{len(skills)}] {skill["name"]}')
        detail = scrape_detail_page(url)
        if detail:
            skill.update(detail)
            fetched += 1
        else:
            failed += 1

        time.sleep(delay)

    print(f'\nDetail pages: {fetched} fetched, {failed} failed')

    skills = sort_skills(skills)
    write_yaml(skills, output_path)
    print(f'\nWritten to {output_path}')

    # Summary by tree
    print(f'\n{"=" * 50}')
    print('By primary tree:')
    tree_counts = {}
    for s in skills:
        t = s['primary_tree']
        tree_counts[t] = tree_counts.get(t, 0) + 1
    for t, c in sorted(tree_counts.items(), key=lambda x: -x[1]):
        cross = sum(1 for s in skills if s['primary_tree'] == t and 'secondary_tree' in s)
        print(f'  {t:15s} {c:3d} total  ({cross} cross-class)')

    return 0


if __name__ == '__main__':
    sys.exit(main())
