import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../../.config/eslint-rules/visual-complexity-spacing.js';

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
});

// =============================================================
// Gap 1: Mixed-direction counting
// Principle 1 — any grouping chars count, regardless of direction
// =============================================================
describe('Gap 1: mixed-direction counting', () => {
    it('counts opening+closing chars together', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                // 2 adjacent — no trigger
                'foo([bar])',
                'foo({bar: 1})',
                'arr.push([1, 2])',
                'bar([baz])',

                // Already spaced
                'foo( [[bar]] )',
                'foo( [{key: 1}] )',
                'foo( bar([baz]) )',
            ],

            invalid: [
                // [[ at open = 3 adjacent with outer (
                {
                    code: 'foo([[bar]])',
                    output: 'foo( [[bar]] )',
                    errors: 2,
                },
                // [{ at open = 3 adjacent with outer (
                {
                    code: 'foo([{key: 1}])',
                    output: 'foo( [{key: 1}] )',
                    errors: 2,
                },
                // ))) = 3 adjacent closing
                {
                    code: 'a(b(c()))',
                    output: 'a( b(c()) )',
                    errors: 2,
                },
            ],
        });
    });

    it('counts mixed open+close clusters', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                // setup({key: fn()}, x) — already spaced
                'setup( {key: fn()}, x )',
            ],
            invalid: [
                // ({  at open = 3 adjacent mixed → space outer
                {
                    code: 'setup({key: fn()}, x)',
                    output: 'setup( {key: fn()}, x )',
                    errors: 2,
                },
                // outer(mid(inner()), 'x') — ()) at close = 3
                {
                    code: "outer(mid(inner()), 'x')",
                    output: "outer( mid(inner()), 'x' )",
                    errors: 2,
                },
            ],
        });
    });
});

// =============================================================
// Gap 2: Balance fix (single-line vs multi-line)
// Principle 7, 10 — single-line balances, multi-line only dense
// =============================================================
describe('Gap 2: single-line vs multi-line balance', () => {
    it('balances both sides on single-line', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                'foo( [[bar]] )',
            ],
            invalid: [
                // Single-line: space both sides
                {
                    code: 'foo([[bar]])',
                    output: 'foo( [[bar]] )',
                    errors: 2,
                },
                // One side already spaced
                {
                    code: 'foo( [[bar]])',
                    output: 'foo( [[bar]] )',
                    errors: 1,
                },
                {
                    code: 'foo([[bar]] )',
                    output: 'foo( [[bar]] )',
                    errors: 1,
                },
            ],
        });
    });

    it('only spaces dense side on multi-line', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                // Multi-line: }); at end is only 2 actual
                // grouping chars + ; = 3 but multi-line block
                // provides structure (Principle 11)
                'foo(\n    bar()\n);',

                // Multi-line callback — block separates
                'setTimeout(() => {\n    doStuff();\n});',
            ],
            invalid: [],
        });
    });
});

// =============================================================
// Gap 3: Template literal sub-rule
// Principle 9 — any grouping chars inside ${} = space
// =============================================================
describe('Gap 3: template literal sub-rule', () => {
    it('spaces ${} when content has grouping chars', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                // No grouping chars — no space
                '`${name}`',
                '`${obj.name}`',

                // Already spaced
                '`${ getName() }`',
                '`${ items[0] }`',
            ],
            invalid: [
                // Call inside template
                {
                    code: '`${getName()}`',
                    output: '`${ getName() }`',
                    errors: 2,
                },
                // Bracket access inside template
                {
                    code: '`${items[0]}`',
                    output: '`${ items[0] }`',
                    errors: 2,
                },
                // Method call inside template
                {
                    code: '`${obj().name}`',
                    output: '`${ obj().name }`',
                    errors: 2,
                },
            ],
        });
    });
});

// =============================================================
// Gap 4: Dense trailing + continuation vs termination
// Principles 2, 3 — . and ! are dense trailing;
//   continuation = unsuppressible, termination = suppressible
// =============================================================
describe('Gap 4: continuation vs termination', () => {
    it('always spaces continuation points', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                // Already spaced continuation
                'wrap( parse(data) ).unwrap()',
            ],
            invalid: [
                // )). continuation → must space
                {
                    code: 'wrap(parse(data)).unwrap()',
                    output: 'wrap( parse(data) ).unwrap()',
                    errors: 2,
                },
                // ))[ continuation → must space
                {
                    code: 'getMap(buildKey(userId))[0]',
                    output: 'getMap( buildKey(userId) )[0]',
                    errors: 2,
                },
            ],
        });
    });

    it('counts ; . ! as dense trailing', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                // ); is only 2 — OK
                'foo(bar);',

                // Already spaced
                'foo( bar(baz) );',

                // Already spaced — )); terminated
                'foo( bar() );',
            ],
            invalid: [
                // )); = 3 dense chars (termination, short content)
                {
                    code: 'foo(bar());',
                    output: 'foo( bar() );',
                    errors: 2,
                },
                // (!( = 3 density chars → space outer
                {
                    code: 'if (!(foo || bar)) { }',
                    output: 'if ( !(foo || bar) ) { }',
                    errors: 2,
                },
            ],
        });
    });
});

// =============================================================
// Gap 5: Arrow function detection
// Principle 12 — concise arrow with nested call = space outer
// =============================================================
describe('Gap 5: arrow function detection', () => {
    it('spaces outer call around concise arrow with nested call', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                // Already spaced
                'skills.forEach( skill => renderCard(skill) )',

                // Block body arrow — block separates (Principle 11)
                'foo(() => { bar() })',
            ],
            invalid: [
                // Concise arrow with call body inside call
                {
                    code: 'skills.forEach(skill => renderCard(skill))',
                    output: 'skills.forEach( skill => renderCard(skill) )',
                    errors: 2,
                },
            ],
        });
    });
});

// =============================================================
// Gap 6: Content-aware suppression
// Principle 4 — long content at termination suppresses spacing
// =============================================================
describe('Gap 6: content-aware suppression', () => {
    it('suppresses spacing for long callee at termination', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                // obj.method = 10+ chars → no space
                'callback(obj.method());',

                // Long callee → no space
                'getData(parseResponse(result));',

                // method parse = 5, short obj pa → no space
                'wrap(pa.parse(data));',
            ],
            invalid: [
                // Short content at termination → space
                {
                    code: 'foo(bar(x));',
                    output: 'foo( bar(x) );',
                    errors: 2,
                },
                // method arse = 4, short obj pa → space
                {
                    code: 'wrap(pa.arse(data));',
                    output: 'wrap( pa.arse(data) );',
                    errors: 2,
                },
            ],
        });
    });
});

// =============================================================
// Gap 7: Bracket access inversion
// Principle 8 — long content in brackets = MORE spacing need
// =============================================================
describe('Gap 7: bracket access inversion', () => {
    it('spaces brackets with long nested content', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                // Short content — no space needed
                'obj[arr[index]]',

                // Long outer name anchors
                'obj[longArrayName[index]]',
            ],
            invalid: [
                // Long content inside brackets → space
                {
                    code: 'obj[arr[longPropertyName]]',
                    output: 'obj[ arr[longPropertyName] ]',
                    errors: 2,
                },
            ],
        });
    });
});

// =============================================================
// Multi-arg suppression
// Principle 13 — multi-arg absorbs trailing char density
// =============================================================
describe('Multi-arg suppression', () => {
    it('suppresses density when trailing char pushed to threshold', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                // Multi arg, )) + ; = trailing-only → no space
                'foo(data, parse());',
            ],
            invalid: [
                // Single arg, )); = 3 → spaced
                {
                    code: 'foo(parse());',
                    output: 'foo( parse() );',
                    errors: 2,
                },
                // Multi arg, but ))) = 3 real → spaced
                {
                    code: "foo(data, bar(parse()));",
                    output: "foo( data, bar(parse()) );",
                    errors: 2,
                },
                // Multi arg, ])) = 3 real grouping → spaced
                {
                    code: 'buildSummaryText(null, new Set([WARFARE, NECROMANCER]))',
                    output: 'buildSummaryText( null, new Set([WARFARE, NECROMANCER]) )',
                    errors: 2,
                },
            ],
        });
    });
});

// =============================================================
// Empty () as density multiplier
// Principle 5
// =============================================================
describe('Empty () as density multiplier', () => {
    it('counts empty () as extending the cluster', () => {
        ruleTester.run('visual-complexity-spacing', rule, {
            valid: [
                // Already spaced
                'foo( bar() )',
            ],
            invalid: [
                // bar() inside foo() — ())] is dense
                {
                    code: 'a(b(c()))',
                    output: 'a( b(c()) )',
                    errors: 2,
                },
            ],
        });
    });
});
