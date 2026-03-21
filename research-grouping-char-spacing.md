# Research: Context-Aware Grouping Character Spacing

> Launch this as a separate Claude Code session in this repo with `--worktree`.
> Check out branch `claude/custom-grouping-char-rule` in the worktree.
> Delete this file after the research is complete.

I need a thorough research document about building a context-aware grouping
character spacing formatter for ESLint. This is exploratory research — produce
a document with findings and recommendations, not code.

## Background

I have a WIP custom ESLint rule on this branch. Read these files first to
understand what exists and the design decisions so far:

- `GROUPING-CHAR-SPACING.md` (working document with confirmed design decisions)
- `.config/eslint-rules/adjacent-bracket-spacing.js` (prototype rule)
- `test/eslint-rules/adjacent-bracket-spacing.test.js` (test cases)
- `.config/eslint.config.mjs` (current ESLint config)

Also read the project roadmap for broader context:
- `~/.claude/projects/-Users-jguluarte-code-dos2-skills/memory/project_roadmap.md`
  (see "Custom ESLint rules" and "deferred rules" sections)

## Research Areas

### 1. ESLint Rule Architecture & Capabilities
- How do ESLint rules inspect tokens vs AST nodes? What are the boundaries?
- Can a single rule inspect adjacent tokens that belong to different AST nodes?
- How does the fixer API work for spacing changes? Can a fix span multiple nodes?
- What are the hard limits of what a rule can do vs what needs a full formatter?
- How do rules compose — can one rule's fix conflict with another's?
- Compare what you find in source code against official documentation and public
  APIs — flag anything that looks internal/unstable

### 2. Deep Dive into Related @stylistic Rules
Examine both the documentation AND source code for:
- `array-bracket-spacing`
- `space-in-parens`
- `template-curly-spacing`
- `object-curly-newline`
- `object-curly-spacing`

For each: how do they inspect tokens? How configurable are they? Could they be
extended with a "context-aware" or "adjacent density" option without breaking
their existing API? What would that PR look like?

Search for open issues or discussions on the @stylistic repo about:
- Context-dependent spacing
- Adjacent bracket/paren density
- Configurable spacing based on nesting depth

### 3. The Context-Aware Problem
The core issue: my style isn't "always space inside X" — it depends on what's
ADJACENT. `foo([bar])` is fine but `foo([[bar]])` needs `foo( [[bar]] )`. No
existing rule handles this because they all work per-node, not cross-node.

- Has anyone in the ESLint ecosystem solved context-dependent spacing?
- Are there existing plugins, RFCs, or blog posts about this approach?
- How do full formatters (Prettier, dprint, Biome) handle grouping chars?
  Could any of them be configured for density-aware spacing?
- What about Prettier plugins — could a custom Prettier plugin handle this?

### 4. Single Unified Rule vs Extending Existing Rules
Two paths forward:
A) One new rule that handles all grouping chars based on adjacency
B) Extend each existing rule with a contextAware/adjacentDensity option

Evaluate both on: maintenance burden, composability, auto-fix reliability,
upstream contribution viability, and how well they handle the edge cases
documented in GROUPING-CHAR-SPACING.md.

### 5. Single-line vs Multi-line Distinction
The WIP rule doesn't distinguish these yet but needs to:
- Single-line: balance both sides
- Multi-line: only space the dense side

How do existing rules handle this distinction? What token/AST APIs are
available to detect single-line vs multi-line expressions?

### 6. Content-Aware Object Curly Spacing
Separate from adjacency: `{ a }` should always have spaces (<=3 chars),
but `{longPropertyName}` is fine without. No existing rule does this.
Could this be an option on object-curly-spacing, or does it need its own rule?

## Output

Write findings to a markdown document on this branch. Structure it as:
1. Findings per research area (with code examples and links to sources)
2. Clearly distinguish between public API / documented behavior vs internal
   implementation details found in source code
3. A recommendation section: which path forward, estimated complexity,
   and what to prototype next
4. Open questions that need user input before proceeding

After drafting, launch subagents to review the document for:
- Technical accuracy (does the analysis match what the source code shows?)
- Clarity and readability (is it well-organized for a developer audience?)
- Completeness (are any research areas underexplored?)

Incorporate reviewer feedback into the final document.

Do NOT write any rule code or modify any config files.
