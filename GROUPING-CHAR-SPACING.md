# Custom Grouping Character Spacing Rule

> Working document for the context-aware spacing rule.
> Delete this file before merging.

## Goal

One unified rule that replaces 4 deferred `@stylistic` rules:
- `array-bracket-spacing`
- `space-in-parens`
- `template-curly-spacing`
- `object-curly-newline`

Plus conditional `object-curly-spacing` (mandatory when <=3 chars inside `{}`).

## Prototype

- Rule: `.config/eslint-rules/adjacent-bracket-spacing.js`
- Tests: `test/eslint-rules/adjacent-bracket-spacing.test.js`
- Not wired into eslint config yet (import is commented out)

## Design Decisions (confirmed with user)

- **Threshold**: 3+ adjacent grouping chars (`()[]{}`) triggers spacing
- **`;` counts as trailing density**: `});` and `));` hit threshold of 3
- **Template `${`**: counts as 2 grouping chars (`$` + `{`)
- **Backtick provides visual separation**: `super(`\`${name}\``)` does NOT trigger — the backtick breaks the visual stacking
- **`super(`\`${skill}\``)` is OK**: backtick meaningfully contributes space

## Still Needs Work

### Balance logic is wrong
Current rule always balances both sides (if closing side triggers, opening side also gets spaced). User clarified:
- **Single-line**: balance both sides — `foo([[bar]])` → `foo( [[bar]] )`
- **Multi-line**: only space the dense side — `});` at end of a callback doesn't require spacing the opening `foo(` lines above

### Content-aware object curly spacing
`object-curly-spacing: "always"` is too blunt. User wants:
- **Mandatory** when <=3 chars inside `{}`: `{ a }` not `{a}`
- **Optional** (but preferred) for longer content

This may be a separate rule or integrated into this one.

### False positive: `_compiled(skill.toJSON());`
During testing, `_compiled( skill.toJSON() );` was generated as a fix — but `)` + `;` is only 2 dense chars, not 3. Need to debug why this triggered. Likely a balance-logic bug (the opening side matched something it shouldn't have).

## Test Coverage

Current tests cover:
- 2 adjacent (valid, no trigger)
- 3 adjacent opening + closing
- 3 adjacent closing only with balance
- Opening-only 3 adjacent
- Nested calls with `)))`
- One side already spaced
- `;` trailing density (`});`, `));`)
- Template `${` as 2-weight opening
- Backtick breaking the chain

## Upstream Contribution?

Before building this as a standalone custom rule, consider contributing
back to `@stylistic/eslint-plugin`:

- The **adjacent-char density** concept doesn't exist in any ESLint plugin
- Could propose a new rule or extend existing rules with a `contextAware` option
- The `object-curly-spacing` content-length threshold is also novel
- Check if there are open issues/discussions on the @stylistic repo about
  context-dependent spacing
- If contributing, the prototype here could serve as a proof-of-concept

Relevant repos:
- https://github.com/eslint-stylistic/eslint-stylistic
- Look at existing rule implementations in `packages/eslint-plugin/rules/`
  for patterns (token inspection, fixer API usage)
