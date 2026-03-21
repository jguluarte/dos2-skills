# Research: Context-Aware Grouping Character Spacing for ESLint

> Findings from investigating feasibility, prior art, and architecture
> for a custom ESLint rule that adds spaces when 3+ grouping characters
> are adjacent. Delete this file before merging.

## Table of Contents

- [Terminology](#terminology)
1. [ESLint Rule Architecture & Capabilities](#1-eslint-rule-architecture--capabilities)
2. [Deep Dive into Related @stylistic Rules](#2-deep-dive-into-related-stylistic-rules)
3. [The Context-Aware Problem: Prior Art](#3-the-context-aware-problem-prior-art)
4. [Single Unified Rule vs Extending Existing Rules](#4-single-unified-rule-vs-extending-existing-rules)
5. [Single-line vs Multi-line Distinction](#5-single-line-vs-multi-line-distinction)
6. [Content-Aware Object Curly Spacing](#6-content-aware-object-curly-spacing)
7. [Recommendations](#7-recommendations)
8. [Open Questions](#8-open-questions)

## Terminology

These terms have specific meanings throughout this document:

- **Grouping characters** — `(`, `)`, `[`, `]`, `{`, `}`. The characters
  that delimit expressions, arrays, objects, and blocks. Template `${`
  is treated as a grouping sequence (see "weight" below).
- **Dense cluster** — a run of 3+ adjacent grouping characters with no
  whitespace between them. E.g., `)))`, `([[`, `});`.
- **Threshold** — the minimum number of adjacent grouping characters that
  triggers spacing (currently 3 in the WIP rule).
- **Balance** — when spacing is added on one side of a bracket pair
  (the dense side), also adding spacing on the matched bracket's side
  for visual symmetry. E.g., `foo([[bar]])` -> `foo( [[bar]] )` spaces
  both `(` and `)` even though only the `([[` and `]])` sides are dense.
- **Weight** — how much a token contributes to the adjacency count.
  Most tokens have weight 1. Template `${` has weight 2 because both
  `$` and `{` contribute to visual density (though `$` is not itself a
  grouping character — the weight is a pragmatic design choice).
- **Dense trailing** — non-grouping characters that contribute to visual
  density when immediately after a closing grouping char. Currently
  only `;` (so `});` counts as 3: `}`, `)`, `;`).

---

## 1. ESLint Rule Architecture & Capabilities

### Token vs AST inspection

ESLint provides two parallel representations: **AST nodes** (accessed via
visitor callbacks like `CallExpression(node) {}`) and **tokens** (accessed
via `context.sourceCode` methods). The WIP rule's core requirement — inspecting
adjacent tokens that belong to *different* AST nodes — is fully supported.
Token methods work independently of node boundaries.

Key SourceCode APIs (all **public and documented**):

| Method | Description |
|--------|-------------|
| `sourceCode.getTokens(node, opts)` | All tokens within a node's range |
| `sourceCode.getTokenAfter(nodeOrToken, opts)` | Next token |
| `sourceCode.getTokenBefore(nodeOrToken, opts)` | Previous token |
| `sourceCode.getFirstToken(node, opts)` | First token of a node |
| `sourceCode.getLastToken(node, opts)` | Last token of a node |
| `sourceCode.getTokensBetween(a, b)` | Tokens between two nodes/tokens |
| `sourceCode.getTokenByRangeStart(index)` | Token at a character index |
| `sourceCode.isSpaceBetween(a, b)` | Whitespace exists between two tokens |
| `sourceCode.getNodeByRangeIndex(index)` | AST node at a character position |

The `opts` parameter accepts `{skip, includeComments, filter}` for most
token methods (`getTokenByRangeStart` accepts only `{ includeComments }`).

### WIP rule API audit

Every API the current prototype uses is **public and stable**. Nothing
internal or deprecated. One minor improvement: the `hasSpaceAfter`/
`hasSpaceBefore` helpers manually compare `token.range[1] < next.range[0]`.
The built-in `sourceCode.isSpaceBetween(tokenA, tokenB)` does the same
thing and is more robust — it iterates token-by-token *including
comments*, so a comment between two tokens won't create a false-positive
range gap. The WIP rule's helpers call `getTokenAfter(token)` without
`{ includeComments: true }`, which could misidentify a comment gap as
whitespace.

### Fixer API

All fixer methods are public:

- `fixer.insertTextAfter(nodeOrToken, text)` / `insertTextBefore`
- `fixer.insertTextAfterRange(range, text)` / `insertTextBeforeRange`
- `fixer.replaceText(nodeOrToken, text)` / `replaceTextRange(range, text)`
- `fixer.remove(nodeOrToken)` / `removeRange(range)`

Range-based methods work on character positions and don't care about AST
boundaries. A `fix()` function can return a single fix, an array, or an
iterable (generator). **Critical constraint: fixes within a single
`fix()` call must not have overlapping ranges.**

### Multi-pass fixing

1. ESLint runs all enabled rules, collects all reported fixes
2. Fixes are sorted by `range[0]`, then `range[1]`
3. Applied greedily in source order — overlapping fixes are **skipped**
4. ESLint re-runs ALL rules on the modified source
5. Repeats up to **10 passes** or until no more fixes apply
6. Circular fix detection: if output matches 2 passes ago, ESLint stops

### Rule composition: there is no priority system

If two rules produce conflicting fixes (one adds a space, another removes
it), they will **oscillate** across passes until ESLint's circular
detection or pass limit stops them. There is no inter-rule communication
or priority mechanism. The only solution is to configure rules so they
don't conflict.

### Hard limits: rules vs formatters

- Rules operate on one file at a time, one fix per report
- Rules cannot coordinate with each other
- Rules cannot suppress other rules' fixes
- For truly complex formatting requiring global awareness of all spacing
  decisions simultaneously, a formatter (Prettier, dprint) is more
  appropriate. But for a targeted rule like "add space when 3+ grouping
  chars are adjacent," an ESLint rule is well within scope.

---

## 2. Deep Dive into Related @stylistic Rules

All 5 rules live in `node_modules/@stylistic/eslint-plugin/dist/rules/`.
They share utilities from `vendor.js` (bundled `@eslint-community/eslint-utils`):

- **`isTokenOnSameLine(left, right)`** — `left.loc.end.line === right.loc.start.line`
- **Token predicates** — `isOpeningBraceToken`, `isClosingParenToken`, etc.
- **`sourceCode.isSpaceBetween(a, b)`** — space detection
- **`createRule()`** — @stylistic's rule creation wrapper

### array-bracket-spacing

**Approach:** AST visitor on `ArrayExpression`/`ArrayPattern`. Gets first/
last tokens via `sourceCode.getFirstToken(node)`/`getLastToken(node)`.

**Schema:** `["always"|"never", { singleValue?, objectsInArrays?, arraysInArrays? }]`

The boolean exceptions *invert* the base behavior for specific adjacent
content types. E.g., `["always", { arraysInArrays: true }]` means "always
space, except no space next to nested arrays." The detection uses
`isObjectType()`/`isArrayType()` checks on the first/last element's AST type.

**Single-line vs multi-line:** Only checks spacing when bracket and next
token are on the same line. Multi-line arrays are silently skipped.

**Key insight for the WIP rule:** The exceptions mechanism is the closest
existing precedent for "adjacent density" behavior — it looks at the
*AST type* of what's adjacent. But it only sees *inside* its own brackets,
never outside them.

### space-in-parens

**Approach:** Raw **token iteration** over all tokens in a `Program`
visitor. Iterates every token, checks if it's `(` or `)`, then examines
adjacent tokens. This is the same architectural approach as the WIP rule.

**Schema:** `["always"|"never", { exceptions?: ["{}"|"[]"|"()"|"empty"] }]`

Exceptions are **token-value based** (checks `token.value` against `{`,
`[`, `(`, `)`, `}`), not AST-type based. E.g., `["never", { exceptions: ["{}"] }]`
means "no spaces in parens, but add space when `{` or `}` is adjacent."

**Single-line vs multi-line:** "Reject space" checks skip when tokens
aren't on the same line. "Missing space" checks apply regardless.

**Key insight:** This rule already has the pattern of "if the thing next
to my paren is a specific bracket, change behavior." That's exactly what
adjacentDensity needs, just generalized from a boolean flip to a
threshold count.

### template-curly-spacing

**Approach:** AST visitor on `TemplateElement` nodes.

**Schema:** `["always"|"never"]` — no exceptions, no options. The simplest
of the 5 rules.

**Single-line vs multi-line:** Uses `isTokenOnSameLine`, skips if different
lines.

**Context awareness:** None. The WIP rule already handles template tokens
correctly (counting `${` as weight 2, backtick breaking the chain).

### object-curly-newline

**Approach:** AST visitor on 7 node types. Finds `{`/`}` tokens via
`getFirstToken`/`getLastToken` with value-matching callbacks
(e.g., `(token) => token.value === "{"`).

**Schema:** `["always"|"never" | { multiline?, minProperties?, consistent? }]`
Or per-node-type overrides:
`[{ ObjectExpression: ..., ObjectPattern: ..., ImportDeclaration: ... }]`

**Key design pattern:** The per-node-type override pattern is proven API
precedent for context-dependent behavior.

**Key insight:** The `multiline` option checks whether *content* spans
multiple lines (not just whether the braces do). The `consistent` option
enforces symmetric behavior — if one brace has a linebreak, both must.

### object-curly-spacing

**Approach:** AST visitor on 7+ node types. The most feature-rich of the 5.

**Schema:**
```
["always"|"never", {
  arraysInObjects?,
  objectsInObjects?,
  overrides?: { ObjectPattern?, ObjectExpression?, ImportDeclaration?, ... },
  emptyObjects?: "ignore"|"always"|"never"
}]
```

Notable features:
- **`overrides`** — per-node-type spacing overrides. Strongest precedent
  for context-dependent behavior that doesn't break the existing API.
- **`arraysInObjects`/`objectsInObjects`** — same inversion pattern as
  `array-bracket-spacing`. Uses `sourceCode.getNodeByRangeIndex()` to
  find the AST node of the adjacent token.
- **`emptyObjects`** — separate handling for `{}` with no content.

**Single-line vs multi-line:** Guards each side independently with
`isTokenOnSameLine(openingToken, tokenAfterOpening)` and separately
`isTokenOnSameLine(tokenBeforeClosing, closingToken)`. This is the
pattern most relevant to the WIP rule's multi-line needs.

### Cross-rule comparison

| Pattern | array-bracket | space-in-parens | template-curly | object-curly-newline | object-curly-spacing |
|---|---|---|---|---|---|
| Inspection | AST visitor | Token iteration | AST visitor | AST visitor | AST visitor |
| Same-line guard | Yes | Partial | Yes | N/A | Yes (per-side) |
| Exceptions | Content-type | Adjacent-token-value | None | Per-node-type | Per-node-type + content-type |
| Processes all instances | No | Yes (token iteration) | No | No | No |

**The WIP rule's approach is fundamentally different from all 5.** It
uses token iteration (like `space-in-parens`) but counts *runs* of
adjacent brackets across AST boundaries. The AST-based rules only
process specific node types and only examine tokens within their own
bracket pairs. `space-in-parens` processes all parens via token
iteration, but only considers the adjacent token's *type*, not a
*count* of consecutive grouping characters.

---

## 3. The Context-Aware Problem: Prior Art

### The core finding: nobody has built this

The concept of "add spacing when N+ grouping characters are adjacent"
does not exist in any published ESLint plugin, code formatter, or
linter across any language ecosystem we surveyed. The density-threshold
approach is genuinely novel.

### Closest matches in the ESLint ecosystem

**eslint/eslint#4689** — Proposed distinguishing paren types (grouping
vs call). Referenced JSCS's `SpacesInsideParenthesizedExpression` with
"categorizer" functions. Never implemented.

**eslint/eslint#14102** — Proposed per-context `space-in-parens` config
(`{ functions: true, calls: true, loopsAndIfs: true }`). Two approaches
discussed (five rules vs one extended rule). Never implemented.

**eslint/eslint#1368** — Early request for `space-in-parens` to support
the same exception system `space-in-brackets` had (`arraysInArrays`,
`objectsInArrays`, etc.). The closest match to "what's adjacent matters."

**eslint-stylistic/eslint-stylistic#244** — Extending the delimiter
spacing concept to TypeScript angle brackets `< >`. Shows demand for
the pattern across all grouping character types.

### Formatters

| Formatter | Density-aware? | What they have |
|---|---|---|
| **Prettier** | No | Single `bracketSpacing` boolean (objects only) |
| **Biome** | No | `bracketSpacing` boolean; closed to new options by philosophy |
| **dprint** | No | No bracket spacing config at all |
| **clang-format** | No | Binary per-bracket-type toggles |
| **rustfmt** | No | `spaces_within_parenthesized_items` (unstable, binary) |
| **gofmt / Black** | No | Zero-config, N/A |

**Prettier forks with more options** (`prettierx`, `prettier-space-parenthesis`)
add binary toggles per bracket type but no density logic. Custom Prettier
plugins could theoretically implement density-aware spacing via the Doc
IR, but none exists.

### Other language ecosystems

**rustfmt#5435** is the most relevant: `spaces_within_parenthesized_items`
was requested with the motivating example
`ipsum_lorem<T>( dolor_amet<T>( string ) )` — the exact same readability
problem. But solved with a binary "always" toggle, not a density threshold.

No blog posts, articles, or RFC documents were found discussing
"adjacent bracket spacing," "grouping character density," or
density-based formatting as a concept.

### Upstream contribution viability

The novelty cuts both ways:
- **Pro:** No existing solution means this fills a real gap. The issue
  history (eslint#4689, #14102, #1368, rustfmt#5435) shows multiple
  people have wanted something like this.
- **Con:** Novelty makes upstream acceptance harder. The @stylistic
  maintainers would need to be convinced the concept is general enough
  to belong in a shared plugin. Biome is explicitly closed to new options.
  Prettier's philosophy is against configurable spacing.

**Realistic path:** Build it as a standalone plugin (`eslint-plugin-adjacent-bracket-spacing`
or similar), prove it works in practice, then propose it upstream with
real-world usage data. This is how most @stylistic rules started — in
ESLint core or JSCS, proven, then migrated.

---

## 4. Single Unified Rule vs Extending Existing Rules

### Option A: One new unified rule

This is the WIP approach. A single rule iterates all tokens, counts
adjacent grouping char runs, and adds spaces when the count hits 3+.

**Pros:**
- Single source of truth for the density concept
- No cross-rule coordination needed
- Naturally handles runs that span different bracket types (`([{`)
- Simpler mental model: "one rule handles density"

**Cons:**
- Must be configured *alongside* the existing rules without conflicts
- Needs to handle all the edge cases the individual rules already handle
  (comments, empty containers, template literals)
- Can't leverage the existing rules' per-node-type granularity

### Option B: Extend each existing rule with a `contextAware` option

Add an `adjacentDensity` or `contextAware` option to each of the 5 rules.

**Pros:**
- Reuses existing rule infrastructure (fixers, schema, node visitors)
- Users configure per-rule, maintaining granularity
- Upstream contribution is easier as an additive option

**Cons:**
- Each rule only sees *inside* its own brackets. To detect "3+ adjacent"
  across AST boundaries, each rule would need to peek outside its node
  using `sourceCode.getTokenBefore(firstToken)` — something none
  currently do.
- Five rules would need coordinated changes for one concept.
- Risk of fix conflicts when multiple rules try to add/remove the same
  space. ESLint has no inter-rule communication.
- The `space-in-parens` exceptions mechanism is the closest precedent,
  but it's a boolean flip per adjacent type, not a count-based threshold.
  Generalizing it would be a significant API change.

### Evaluation

| Criterion | Unified rule | Extending existing |
|---|---|---|
| Maintenance burden | One rule to maintain | Five rules to patch |
| Composability | Must avoid conflicting with individual rules | Built into each rule |
| Auto-fix reliability | One fixer, no conflicts with itself | Five fixers, potential inter-rule conflicts |
| Upstream viability | Standalone plugin, easy to distribute | Harder — requires changes to 5 existing rules |
| Edge case coverage | Must reimplement some logic | Inherits existing handling |

**Recommendation: Option A (unified rule).** The density concept is
inherently cross-bracket-type, and the existing rules aren't designed to
look outside their own brackets. Extending them would be fighting the
architecture.

### Managing conflicts with existing rules

The unified rule will coexist with the 5 @stylistic rules. The key
conflict scenarios and solutions:

1. **`space-in-parens: "never"` vs custom rule adding space after `(`**
   These will oscillate. Solution: the project already doesn't use
   `space-in-parens`. Leave it off, let the custom rule own paren spacing
   in dense contexts. Non-dense contexts don't need the space, and the
   default behavior (no space) is correct.

2. **`array-bracket-spacing: "never"` vs custom rule adding space after
   `[`** Same oscillation risk. Solution: don't enable
   `array-bracket-spacing`. The custom rule handles the dense cases; the
   non-dense cases are fine without spaces.

3. **`object-curly-spacing: "always"` vs custom rule** No conflict — the
   custom rule adds spaces, `object-curly-spacing: "always"` also wants
   spaces. They agree.

4. **`template-curly-spacing: "never"` vs custom rule adding space inside
   `${}`** Potential conflict on `${ [arr] }`. Solution: don't enable
   `template-curly-spacing`. The custom rule handles the dense case.

**General principle:** The 4 deferred rules (`array-bracket-spacing`,
`space-in-parens`, `template-curly-spacing`, `object-curly-newline`)
remain off. The custom rule handles the density cases these would have
partially covered. `object-curly-spacing` stays on `"always"` since it
doesn't conflict.

---

## 5. Single-line vs Multi-line Distinction

### Available APIs

Two primitives used throughout @stylistic:

**`isTokenOnSameLine(left, right)`** (from `vendor.js`):
```js
function isTokenOnSameLine(left, right) {
    return left.loc.end.line === right.loc.start.line;
}
```

**`isSingleLine(node)`** (from `utils.js`):
```js
function isSingleLine(node) {
    return node.loc.start.line === node.loc.end.line;
}
```

No higher-level utilities exist. Every @stylistic rule composes from
these two primitives.

### How existing rules handle the distinction

- **`brace-style`** (`allowSingleLine`): checks
  `isTokenOnSameLine(openBrace, closeBrace)` on the bracket pair.
- **`object-curly-newline`** (`multiline`): checks whether *content*
  spans lines, not just the braces.
- **`object-curly-spacing`**: guards each side **independently** —
  `isTokenOnSameLine(openingToken, tokenAfterOpening)` and separately
  `isTokenOnSameLine(tokenBeforeClosing, closingToken)`. This is the
  most relevant pattern.

### Application to the WIP rule

The design goal: single-line expressions balance both sides, multi-line
expressions only space the dense side.

The `object-curly-spacing` approach is the right model — **check each
side independently**:

```
foo(                    // line 1: (
  doSomething([[bar]])  // line 2: [[bar]] is single-line
);                      // line 3: );
```

- `);` on line 3: `)` and `;` are on the same line, so adjacency applies
  to the closing side. The opening `foo(` is on line 1 — different line,
  so the opening side is NOT balanced.
- `[[bar]]` on line 2: both `[[` and `]]` are on the same line as their
  matched brackets, so both sides get spacing.

**Proposed algorithm:**

1. Find a dense cluster (3+ adjacent grouping chars)
2. Identify the **outermost token** in the cluster — the token closest
   to non-grouping content. In `foo([[bar]])`, the opening cluster is
   `([[` and the outermost is `(` (the one furthest from the nested
   content `bar`). In `]])`, the outermost is `)`.
3. Find the outermost token's matching bracket
4. Check `isTokenOnSameLine(outerToken, matchingBracket)`
5. If same line: balance both sides (space both the dense side and the
   matching bracket side)
6. If different lines: only space the dense side

**Finding the matching bracket:** ESLint has no built-in "find matching
bracket" API. The WIP rule already implements `findMatchingBracket()` via
depth-counter token walking (incrementing on openers, decrementing on
closers until depth reaches 0). An alternative is using
`sourceCode.getNodeByRangeIndex(token.range[0])` to find the AST node a
token belongs to, then getting the node's first/last token. The AST
approach is more robust (handles comments and edge cases better) but more
complex.

### The nested case

Consider outer brackets multi-line but inner cluster single-line:

```js
foo(
  bar([[baz]])
);
```

- `[[baz]]` on one line: both sides get balanced spacing ->
  `bar( [[baz]] )`
- `foo(` on line 1, `);` on line 3: multi-line. The `)` + `;` is only
  2 dense chars (below threshold), so no spacing triggered. Correct.

If the inner call were also dense:

```js
foo(
  bar(baz())
);
```

- `baz())` on one line: `)` + `)` + `)` = 3, triggers. But the outermost
  `)` here is `bar(...))`'s closing paren, and `bar(` is on the same
  line. So both sides get balanced: `bar( baz() )`
- `);` on line 3: only 2 dense chars, no trigger. Correct.

---

## 6. Content-Aware Object Curly Spacing

### Key finding: this may not be needed

The project already uses `@stylistic/object-curly-spacing: ["error", "always"]`.
With "always" as the default, *all* content gets spaces — `{ a }`,
`{ longPropertyName }`, everything. The `{a}` case is already a violation.
Content-aware spacing would only matter if the project wanted to switch
to `"never"` as the default and add spaces selectively for short content.
See [open question 8.6](#86-content-aware-curly-spacing-priority).

The rest of this section documents the feasibility analysis in case the
requirement resurfaces.

### The requirement

- `{ a }` — MUST have spaces (short content is hard to read without them)
- `{ longPropertyName }` — spaces preferred but optional
- `{a}` — violation

The threshold is about the *token span* inside the braces (the character
width of the actual content tokens, not counting surrounding whitespace).
In `{a}`, the content span is 1 character. The proposed threshold of ~3
characters means identifiers like `a`, `x`, `id` would require spaces,
while longer identifiers like `name`, `value` are tolerable without.

### Does any existing rule do content-length-based spacing?

**No.** No rule in the @stylistic package or broader ESLint ecosystem
makes spacing decisions based on character count. The closest analogues
use element/property *counts*:

- `object-curly-newline` / `array-bracket-newline`: `minProperties` /
  `minItems` — but these count AST nodes, not characters
- `array-bracket-spacing`: `singleValue` exception — element count (1),
  not content length

Content-length-based spacing would be novel.

### How to measure "content length"

Three approaches:

| Approach | Method | Pros | Cons |
|---|---|---|---|
| Character count | `closeBrace.range[0] - openBrace.range[1]` | Simple, matches visual | Includes existing spaces |
| Trimmed content | `sourceCode.getText().slice(open, close).trim().length` | Ignores whitespace | Slightly more work |
| Token span | `lastContent.range[1] - firstContent.range[0]` | Measures actual content | Ignores surrounding space |

**Recommendation: token span** (distance from first content token to
last content token). This measures the actual content without being
influenced by existing whitespace. A threshold of ~3 characters would
mean `{a}` (1 char, needs spaces) and `{id}` (2 chars, needs spaces)
require spacing, while `{name}` (4 chars, readable without) does not.

### Separate rule or integrated?

**Separate rule.** Reasons:

- **Different concern:** Adjacency spacing is about adjacent grouping
  characters (`]])`). Content-aware curly spacing is about readability
  of short identifiers inside braces (`{a}`). Different triggers,
  different fix strategies.
- **Conflict avoidance:** If integrated, the adjacency rule needs
  object-curly-spacing semantics and vice versa. Two rules coexist
  cleanly.
- **Existing owner:** `object-curly-spacing` already owns the `{ }`
  domain. A content-aware variant should relate to it.

### Upstream feasibility

If the goal is to eventually *contribute* this upstream as a
`minContentLength` option on `object-curly-spacing`, the implementation
would go in `validateBraceSpacing()`, overriding the `spaced` variable
based on content width. But as a standalone custom rule, it would need to
avoid conflicting with whatever `object-curly-spacing` is set to.

---

## 7. Recommendations

### Path forward: build the unified rule

1. **Keep the unified rule approach** (Option A). The density concept is
   cross-bracket-type and doesn't fit cleanly into the per-bracket
   existing rules.

2. **Implement single-line vs multi-line** using per-side independent
   checks (the `object-curly-spacing` pattern):
   - Find the matched bracket for the outermost token in a dense cluster
   - If both are on the same line: balance both sides
   - If on different lines: only space the dense side

3. **Fix the balance bug** that causes false positives like
   `_compiled( skill.toJSON() );`. Root cause analysis: the closing-run
   handler finds `);` (2 chars: `)` + `;`), which is below threshold.
   But the *opening-run* handler finds `_compiled(` followed by
   `skill.toJSON()` — the `()` of `.toJSON()` creates a closing run
   `));` when combined with the outer `)`. The closing-run handler at
   line 213 then triggers balance logic on the matched opening bracket.
   The fix: the balance logic (lines 196-208 and 240-252) should check
   `isTokenOnSameLine` before balancing, and the closing-run handler
   should not count `;` toward runs that are below threshold before
   the trailing char is added. This is closely related to the
   single-line vs multi-line work in recommendation #2.

4. **Leave the 4 deferred @stylistic rules off.** The custom rule
   replaces them for the density cases. Non-dense cases don't need
   spacing and the default (no space) is correct.

5. **Keep `object-curly-spacing: "always"`** as-is. It doesn't conflict
   with the custom rule and already handles the content-aware curly
   spacing concern (short content gets spaces because *all* content
   gets spaces).

6. **Defer content-aware curly spacing** to a future rule. It's only
   needed if the default changes from "always" to "never." Not urgent.

7. **Consider `sourceCode.isSpaceBetween()`** as a minor improvement
   over the manual range comparison in `hasSpaceAfter`/`hasSpaceBefore`.

### Estimated complexity

- **Single-line vs multi-line:** Moderate. The matched-bracket lookup
  already exists. Adding the `isTokenOnSameLine` check and branching on
  it is straightforward. The main complexity is deciding *which* matched
  bracket to check when a cluster has multiple nested levels.

- **Balance bug fix:** Low-moderate. Likely involves removing the
  unconditional balance logic from the closing-run handler and replacing
  it with the single-line/multi-line check.

- **Content-aware curly spacing:** Low complexity but deferred.

### Upstream contribution

The concept is novel enough to be interesting to the @stylistic
maintainers, but acceptance is uncertain. Recommended approach:

1. Build it as a standalone ESLint plugin
2. Use it in this project, validate the design decisions
3. Write up the concept with real-world examples
4. Propose it as a new rule to @stylistic (not as an option on existing
   rules — the cross-bracket nature makes it a poor fit for extension)

---

## 8. Open Questions

These need user input before implementation proceeds:

### 8.1 Threshold configurability (relates to recommendation #7, upstream)

Should the threshold (currently hardcoded at 3) be configurable via rule
options? E.g., `["error", { threshold: 3 }]`. This would make the rule
more general and upstream-contribution-friendly, but adds complexity.

### 8.2 Dense trailing characters (relates to recommendation #3, bug fix)

Currently only `;` is in `DENSE_TRAILING`. Should `,` count? What about
`.` (for chained calls like `)));.then()`)?

### 8.3 Balance behavior for mixed clusters (relates to recommendation #2, multi-line)

When a single-line expression has density on only one side:
```js
foo([[bar]], baz)
```
The current rule spaces both sides: `foo( [[bar]], baz )`. Is this still
desired? The `baz` side has no density — spacing it is purely for
symmetry. The research shows `object-curly-spacing`'s approach of
checking each side independently, which would suggest only spacing the
`[[` side. But that looks odd: `foo( [[bar]], baz)`.

### 8.4 What constitutes "the same line"? (relates to recommendation #2)

Should the rule check if the *outermost bracket pair* spans multiple
lines, or if the *dense cluster itself* spans multiple lines? These can
differ:

```js
// Outermost pair is multi-line, but the cluster is single-line:
foo(
  bar([[baz]])
);
```

The proposed algorithm checks the outermost *in the cluster*, which means
`bar([[baz]])` checks `bar(`...`)` — same line, so balance. This seems
correct. But should be confirmed.

### 8.5 Rule name (relates to upstream contribution)

`adjacent-bracket-spacing` is descriptive but long. Alternatives:
- `grouping-char-spacing`
- `bracket-density-spacing`
- `adjacent-grouping-spacing`

The name matters for upstream contribution and discoverability.

### 8.6 Content-aware curly spacing priority (relates to recommendation #6)

Given that `object-curly-spacing: "always"` already handles the `{a}`
case (see [section 6](#6-content-aware-object-curly-spacing)), is the
content-aware rule still on the roadmap? Or should it be dropped unless
the default changes?

---

## Appendix: Source References

### ESLint Core
- [SourceCode API (documented)](https://eslint.org/docs/latest/extend/custom-rules#accessing-the-source-code)
- [Fixer API (documented)](https://eslint.org/docs/latest/extend/custom-rules#applying-fixes)
- [Rule structure (documented)](https://eslint.org/docs/latest/extend/custom-rules)

### @stylistic Source Code
- `node_modules/@stylistic/eslint-plugin/dist/rules/array-bracket-spacing.js`
- `node_modules/@stylistic/eslint-plugin/dist/rules/space-in-parens.js`
- `node_modules/@stylistic/eslint-plugin/dist/rules/template-curly-spacing.js`
- `node_modules/@stylistic/eslint-plugin/dist/rules/object-curly-newline.js`
- `node_modules/@stylistic/eslint-plugin/dist/rules/object-curly-spacing.js`
- Shared utilities: `node_modules/@stylistic/eslint-plugin/dist/utils.js`

### Related Issues
- [eslint#4689 — space-in-parens exception for function calls](https://github.com/eslint/eslint/issues/4689)
- [eslint#14102 — Enhancements for space-in-parens](https://github.com/eslint/eslint/issues/14102)
- [eslint#1368 — space-in-parens exceptions](https://github.com/eslint/eslint/issues/1368)
- [eslint#4257 — Missing errors with nested parens](https://github.com/eslint/eslint/issues/4257)
- [eslint-stylistic#244 — Space in generics](https://github.com/eslint-stylistic/eslint-stylistic/issues/244)
- [prettier#1303 — Space between parens and brackets](https://github.com/prettier/prettier/issues/1303)
- [prettier#13107 — Paren spacing option](https://github.com/prettier/prettier/issues/13107)
- [rustfmt#5435 — spaces_within_parenthesized_items](https://github.com/rust-lang/rustfmt/issues/5435)
