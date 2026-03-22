# Grouping Character Spacing Philosophy

Justin's approach to spacing around grouping characters (`()`, `[]`, `{}`,
`${}`) is context-dependent, not binary "always"/"never". The goal is
readability — help the eye parse structure when density or distance makes
it hard. This applies across all languages, not just JavaScript.

## Core Principles

### 1. Adjacent grouping char density

When 3+ grouping characters are adjacent (no whitespace between them),
the outermost container gets spaced. Grouping chars of any type
(`()[]{}`) and direction (open/close) count toward the threshold.

```
foo( bar(baz()) );      // ()) = 3 adjacent mixed → space outer
foo( [[bar]] );         // [[ at open, ]] at close = 3+ → space outer
setup( {key: fn()}, x ) // ()} = 3 adjacent mixed → space outer
```

### 2. Dense trailing characters

Characters beyond grouping chars that contribute to visual density when
adjacent: `.`, `;`, `!`. The full density character set is `(){}[]!.;`.

`,` does NOT count — `comma-spacing` always adds a space after commas,
which breaks the cluster. Most operators also get spaces from
`space-infix-ops`. This set is language-specific; in JS/TS, these are
the characters that realistically appear adjacent without spaces.

```
foo( bar() );           // )); = 3 dense → space
wrap( parse(x) ).next() // )). = 3 dense → space
foo(bar(), baz);        // ), = broken by comma+space → no trigger
```

### 3. Continuation vs termination

When a dense cluster meets the threshold, whether spacing can be
suppressed depends on what follows:

- **Continuation** (`.method()`, `[prop]`, `(args)`) — the reader must
  parse THROUGH the density to keep reading. Harder to suppress with
  content length.
- **Termination** (`;`, end-of-line) — the reader is done. Density at
  the end of a reading path is more tolerable. Suppressible by long
  content.

```
wrap( parse(data) ).unwrap()       // )). continuation → spaced
wrap( parse(data) )[0]             // ))[ continuation → spaced
callback(obj.method());            // )); termination, long content → no space
getData(parseResponse(result));    // )); termination, long content → no space
foo( bar(x) );                     // )); termination, short content → spaced
```

The character itself (`.` vs `;`) isn't inherently hard or soft — what
matters is whether the expression continues after the cluster.

### 4. Content-aware suppression (termination only)

When density is at a termination point (`;`), long readable content
between the outer parens can suppress spacing. The identifier immediately
before `(` (the callee/method name) is the primary factor:

- Member access: the method name (after the dot) needs ~5 chars with a
  short object, ~4 chars with a long object (5+ chars)
- Long callee expressions like `obj.method` (10+ chars) provide strong
  visual anchoring
- Continuation points (`.method()`, `[prop]`) are NOT suppressible by
  content length

```
callback(obj.method());            // termination, obj.method = 10 → no space
wrap( parse(data) );               // termination, parse = 5, no object → space
wrap(pa.parse(data));              // termination, method parse = 5 → no space
wrap( pa.arse(data) );             // termination, method arse = 4, short obj → space
wrap( parse(data) ).unwrap()       // continuation → always spaced
getMap( buildKey(userId) )[0];     // continuation → always spaced
getData(parseResponse(result));    // termination, long content → no space
```

### 5. Empty `()` is a density multiplier

Empty function calls `()` create `(` `)` adjacent, which extends any
surrounding cluster. `fn()` inside brackets means `()]` or `())` =
3 adjacent.

```
callbacks[ getName() ];            // () inside [] → ()]; = dense
const msg = `${ getId() }`;       // () inside ${} → dense
foo( bar() );                      // () extends )) to ())
```

### 6. Short inner content needs spacing

When the innermost argument/content is very short (1-2 chars), the
grouping chars dominate visually:

```
foo( bar(x) );                     // x = 1 char → space
foo( bar(ba) );                    // ba = 2 chars → space
foo(bar(baz));                     // baz = 3 chars → no space
```

### 7. Balance: space the outermost container

When spacing is triggered, it goes on the **outermost** bracket pair
that contains the density. Inner pairs stay unspaced.

```
arr.push( transform(clean(x)) ).length  // outer = push(), not transform()
outer( mid(inner()), 'x' )              // outer = outer(), not mid()
```

For single-line expressions, both sides of the outer pair get spaced
(balanced). For multi-line, only the dense side gets spaced.

### 8. Bracket access `[]`: long content = MORE spacing

Opposite of function calls. Long content inside brackets pushes `]` far
from `[`, making bracket matching hard. Spacing the outer brackets
clarifies structure:

```
return obj[ arr[longPropertyName] ];   // long content → space (matching help)
return obj[arr[index]];                // short content → no space (easy match)
return obj[longArrayName[index]];      // long outer name anchors → no space
```

### 9. Template literals: any grouping chars inside = space

`${ }` gets spaced whenever the content contains any grouping characters
(calls, brackets, etc.), regardless of count thresholds:

```
const msg = `${ getName() }`;     // call inside → space
const msg = `${ items[0] }`;      // brackets inside → space
const msg = `${ obj().name }`;    // call inside → space
const msg = `${obj.name}`;        // no grouping chars → no space
const msg = `${name}`;            // no grouping chars → no space
```

### 10. Multi-line: only space the dense side

When a bracket pair spans multiple lines, don't balance — only space the
side that has the density. The line break provides visual separation on
the other side.

```
foo(
    bar( baz() )    // inner single-line → balanced
);                  // outer multi-line → ); is only 2, no trigger

setTimeout(() => {
    doStuff();
});                 // multi-line block → }); unspaced, block provides structure
```

### 11. Block braces `{ }` provide visual separation

Block bodies with statements inside act as visual separators. `});` at
the end of a multi-line callback doesn't trigger spacing because the
block structure gives the eye enough scaffolding:

```
foo(() => { bar() });              // block separates → no outer spacing
foo( () => bar() );                // concise arrow, no block → outer spacing
```

### 12. Cognitive density (arrows with nested calls)

Arrow functions with nested calls add cognitive density beyond what
character counting captures. The `param => call(param)` pattern causes
the eye to bounce back and forth:

```
skills.forEach( skill => renderCard(skill) );  // lambda + nested call → space
```

This area needs more research — it may connect to expression complexity
metrics rather than simple character adjacency.

### 13. Multi-argument suppression (trailing only)

Multiple arguments provide visual structure (comma-separated list shape)
that can suppress density — but ONLY when the threshold is reached via
a trailing character (`;`), not when 3+ actual grouping chars are
adjacent:

```
foo( parse() );              // single arg, )); = 3 → spaced
foo(data, parse());          // multi arg, )) + ; = 2 real + trailing → no space
foo( data, bar(parse()) );   // multi arg, but ))) = 3 real → spaced
buildSummaryText( null, new Set([ITEMS]) )  // ])) = 3 real → spaced
```

The principle: multi-arg absorbs the trailing character's contribution
to density, but cannot absorb 3+ actual grouping chars stacking up.

### 14. Maximum expression nesting depth per line

3 levels of call nesting is the max for a single line. At 4+ levels,
the line is too complex — extract to intermediate variables:

```
foo( bar(baz) )            // 2 deep — fine
foo( bar(baz()) )          // 3 deep — fine (limit)
foo( bar(baz(fizz)) )      // 4 deep — too complex, break up
foo( bar( baz(fizz) ) )    // 4 deep — still too complex even with spacing

// Should be:
const result = baz(fizz);
foo( bar(result) )
```

This is a separate concern from density spacing (which handles *how* to
space). This handles *when a line is too complex to keep inline at all*.
Could be a companion rule (`max-expression-depth` or similar).

Related: if the density rule WANTS to add spaces, that may itself be
a signal the line should break up rather than space inline. The
unspaced version is tolerable because it's compact; adding spaces makes
it long AND complex → multi-line is better.

Multiple nested-call arguments compound the issue:
```
foo(bar(baz), fizz(buzz))             // edge of single-line
foo( bar(baz), fizz(buzz) )           // if spacing needed → break up instead
foo(bar(baz), fizz(buzz), buzz(fizz)) // 3 nested-call args → too much
```

Multi-line doesn't have to be one-arg-per-line — grouping related args
on the same line can be clearer. The formatting depends on visual weight,
not a rigid one-per-line rule.

## Open Questions

- Exact threshold for `));` suppression by content length — the boundary
  is fuzzy and may depend on expression type (plain call vs member access
  vs arrow function)
- Whether cognitive density (arrows, ternaries, etc.) should be a
  separate trigger or approximated by existing rules
- How alignment across chained lines interacts with spacing decisions
