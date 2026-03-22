/**
 * Tests for the visual-complexity-spacing ESLint rule.
 *
 * This rule adds spaces inside the outermost bracket when 3 or more
 * adjacent grouping characters (parens, brackets, braces, plus ; . !)
 * pile up without whitespace, e.g., foo([[bar]]) becomes foo( [[bar]] ).
 *
 * It accounts for chained access, template literals, arrow functions,
 * function name length, and argument count to decide when spacing is
 * needed vs when the code is already readable without it.
 */

import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../../.config/eslint-rules/visual-complexity-spacing.js';

const RULE = 'visual-complexity-spacing';

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
});

function valid(...cases) {
    return { valid: cases, invalid: [] };
}

function invalid(...cases) {
    return { valid: [], invalid: cases };
}

// errors = 2 because each fix adds both an open-side space
// and a close-side space (two separate violations)
function fix(code, output, errors = 2) {
    return { code, output, errors };
}

describe('visual-complexity-spacing', () => {

    // Principle 1: density threshold
    describe('nested brackets (3+ adjacent)', () => {

        it('allows 2 adjacent: foo([bar])', () => {
            ruleTester.run(RULE, rule, valid(
                'foo([bar])',
                'foo({bar: 1})',
                'arr.push([1, 2])',
            ));
        });

        it('adds spaces for 3+ adjacent brackets: foo([[bar]]) -> foo( [[bar]] )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix('foo([[bar]])', 'foo( [[bar]] )'),
            ));
        });

        it('adds spaces for mixed types: foo([{key: 1}]) -> foo( [{key: 1}] )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix('foo([{key: 1}])', 'foo( [{key: 1}] )'),
            ));
        });

        it('adds spaces for 3 closing parens: a(b(c())) -> a( b(c()) )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix('a(b(c()))', 'a( b(c()) )'),
            ));
        });

        it('adds spaces at open boundary: setup({key: fn()}, x) -> setup( {key: fn()}, x )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'setup({key: fn()}, x)',
                    'setup( {key: fn()}, x )',
                ),
            ));
        });

        it('adds spaces for nested call cluster: outer(mid(inner()), \'x\') -> outer( mid(inner()), \'x\' )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    "outer(mid(inner()), 'x')",
                    "outer( mid(inner()), 'x' )",
                ),
            ));
        });

        it('allows already-spaced expressions: foo( [[bar]] )', () => {
            ruleTester.run(RULE, rule, valid(
                'foo( [[bar]] )',
                'foo( [{key: 1}] )',
                'foo( bar([baz]) )',
                'foo( bar() );',
            ));
        });

        it('adds spaces for new keyword with nested constructors: new Set(new Map([])) -> new Set( new Map([]) )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'new Set(new Map([]))',
                    'new Set( new Map([]) )',
                ),
            ));
        });

        it('adds spaces for spread with nested calls: foo(...bar(baz())) -> foo( ...bar(baz()) )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'foo(...bar(baz()))',
                    'foo( ...bar(baz()) )',
                ),
            ));
        });
    });

    // Principle 2: single-line balance
    describe('single-line symmetry', () => {

        it('adds missing space on the unspaced close side: foo( [[bar]]) -> foo( [[bar]] )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix('foo( [[bar]])', 'foo( [[bar]] )', 1),
            ));
        });

        it('adds missing space on the unspaced open side: foo([[bar]] ) -> foo( [[bar]] )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix('foo([[bar]] )', 'foo( [[bar]] )', 1),
            ));
        });
    });

    // Principle 3: multi-line whitespace provides separation
    describe('multi-line expressions', () => {

        it('allows multi-line calls where line breaks provide separation: foo(\\n  bar()\\n);', () => {
            ruleTester.run(RULE, rule, valid(
                'foo(\n    bar()\n);',
            ));
        });

        it('allows multi-line callbacks with block body: setTimeout(() => {\\n  doStuff();\\n});', () => {
            ruleTester.run(RULE, rule, valid(
                'setTimeout(() => {\n    doStuff();\n});',
            ));
        });
    });

    // Principle 6: template expression density
    describe('template literal ${} expressions', () => {

        it('allows ${} without brackets or parens: `${name}`', () => {
            ruleTester.run(RULE, rule, valid(
                '`${name}`',
                '`${obj.name}`',
            ));
        });

        it('adds spaces when ${} contains a call: `${getName()}` -> `${ getName() }`', () => {
            ruleTester.run(RULE, rule, invalid(
                fix('`${getName()}`', '`${ getName() }`'),
            ));
        });

        it('adds spaces when ${} contains brackets: `${items[0]}` -> `${ items[0] }`', () => {
            ruleTester.run(RULE, rule, invalid(
                fix('`${items[0]}`', '`${ items[0] }`'),
            ));
        });

        it('adds spaces when ${} contains a method call: `${obj().name}` -> `${ obj().name }`', () => {
            ruleTester.run(RULE, rule, invalid(
                fix('`${obj().name}`', '`${ obj().name }`'),
            ));
        });
    });

    // Principle 5: continuation always needs spacing
    describe('chained access after nested parens (always spaces)', () => {

        it('adds spaces before .method(): wrap(parse(data)).unwrap() -> wrap( parse(data) ).unwrap()', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'wrap(parse(data)).unwrap()',
                    'wrap( parse(data) ).unwrap()',
                ),
            ));
        });

        it('adds spaces before [index]: getMap(buildKey(userId))[0] -> getMap( buildKey(userId) )[0]', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'getMap(buildKey(userId))[0]',
                    'getMap( buildKey(userId) )[0]',
                ),
            ));
        });

        it('allows already-spaced continuation: wrap( parse(data) ).unwrap()', () => {
            ruleTester.run(RULE, rule, valid(
                'wrap( parse(data) ).unwrap()',
            ));
        });
    });

    // Principle 8: trailing punctuation density
    describe('semicolons and trailing punctuation', () => {

        it('allows 2 adjacent + semicolon: foo(bar);', () => {
            ruleTester.run(RULE, rule, valid(
                'foo(bar);',
            ));
        });

        it('adds spaces for )); at statement end: foo(bar()); -> foo( bar() );', () => {
            ruleTester.run(RULE, rule, invalid(
                fix('foo(bar());', 'foo( bar() );'),
            ));
        });

        it('adds spaces for !( prefix: if (!(foo || bar)) -> if ( !(foo || bar) )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'if (!(foo || bar)) { }',
                    'if ( !(foo || bar) ) { }',
                ),
            ));
        });

        it('adds spaces for await with short nested call: await foo(bar()); -> await foo( bar() );', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'await foo(bar());',
                    'await foo( bar() );',
                ),
            ));
        });
    });

    // Principle 9: concise arrow body density
    describe('concise arrow functions inside calls', () => {

        it('adds spaces for arrow with call body: forEach(skill => renderCard(skill)) -> forEach( skill => renderCard(skill) )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'skills.forEach(skill => renderCard(skill))',
                    'skills.forEach( skill => renderCard(skill) )',
                ),
            ));
        });

        it('allows block body arrows: foo(() => { bar() })', () => {
            ruleTester.run(RULE, rule, valid(
                'foo(() => { bar() })',
                'foo(()=>{ bar(); });',
            ));
        });

        it('allows block body function expressions: foo(function(){ bar(); });', () => {
            ruleTester.run(RULE, rule, valid(
                'foo(function(){ bar(); });',
                'foo(function handler(){ bar(); });',
            ));
        });

        it('adds spaces for each concise arrow call in chain: arr.map(x => f(x)).filter(y => g(y)) -> arr.map( x => f(x) ).filter( y => g(y) )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'arr.map(x => f(x)).filter(y => g(y))',
                    'arr.map( x => f(x) ).filter( y => g(y) )',
                    4,
                ),
            ));
        });
    });

    // Principle 4: visual anchoring suppression
    describe('long identifiers reduce spacing need (statement end only)', () => {

        it('allows long method name at statement end: callback(obj.method());', () => {
            ruleTester.run(RULE, rule, valid(
                'callback(obj.method());',
            ));
        });

        it('allows long callee at statement end: getData(parseResponse(result));', () => {
            ruleTester.run(RULE, rule, valid(
                'getData(parseResponse(result));',
            ));
        });

        it('adds spaces for short names at statement end: foo(bar(x)); -> foo( bar(x) );', () => {
            ruleTester.run(RULE, rule, invalid(
                fix('foo(bar(x));', 'foo( bar(x) );'),
            ));
        });

        it('adds spaces for short method at statement end: wrap(ab.cdef(data)); -> wrap( ab.cdef(data) );', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'wrap(ab.cdef(data));',
                    'wrap( ab.cdef(data) );',
                ),
            ));
        });

        it('prioritizes inner callee over outer: callback(fn(x)); -> callback( fn(x) );', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'callback(fn(x));',
                    'callback( fn(x) );',
                ),
            ));
        });

        it('allows long method (5+ chars) with short object: wrap(pa.parse(data));', () => {
            ruleTester.run(RULE, rule, valid(
                'wrap(pa.parse(data));',
            ));
        });
    });

    // Principle 7: bracket access inversion
    describe('nested bracket access (computed properties)', () => {

        it('allows short nested access: obj[arr[index]]', () => {
            ruleTester.run(RULE, rule, valid(
                'obj[arr[index]]',
            ));
        });

        it('allows long outer name: obj[longArrayName[index]]', () => {
            ruleTester.run(RULE, rule, valid(
                'obj[longArrayName[index]]',
            ));
        });

        it('adds spaces for long inner content: obj[arr[longPropertyName]] -> obj[ arr[longPropertyName] ]', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'obj[arr[longPropertyName]]',
                    'obj[ arr[longPropertyName] ]',
                ),
            ));
        });
    });

    // Principle 13: multi-arg absorption
    describe('multiple arguments absorb trailing-only density', () => {

        it('allows multi-arg with nested call at end: foo(data, parse());', () => {
            ruleTester.run(RULE, rule, valid(
                'foo(data, parse());',
            ));
        });

        it('adds spaces for single-arg: foo(parse()); -> foo( parse() );', () => {
            ruleTester.run(RULE, rule, invalid(
                fix('foo(parse());', 'foo( parse() );'),
            ));
        });

        it('adds spaces when 3+ real brackets stack in multi-arg: foo(data, bar(parse())); -> foo( data, bar(parse()) );', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'foo(data, bar(parse()));',
                    'foo( data, bar(parse()) );',
                ),
            ));
        });

        it('adds spaces for ])) in multi-arg: buildSummaryText(null, new Set([WARFARE, NECROMANCER])) -> buildSummaryText( null, new Set([WARFARE, NECROMANCER]) )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'buildSummaryText(null, new Set([WARFARE, NECROMANCER]))',
                    'buildSummaryText( null, new Set([WARFARE, NECROMANCER]) )',
                ),
            ));
        });

        it('adds spaces for single-arg object with inner commas: foo({a: 1, b: 2}); -> foo( {a: 1, b: 2} );', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'foo({a: 1, b: 2});',
                    'foo( {a: 1, b: 2} );',
                ),
            ));
        });
    });

    // Edge cases: comments, optional chaining, custom threshold
    describe('comments between grouping characters', () => {

        it('allows comment breaking adjacency: foo(bar()/* comment */)', () => {
            ruleTester.run(RULE, rule, valid(
                'foo(bar()/* comment */)',
            ));
        });
    });

    describe('optional chaining', () => {

        it('adds spaces for closing )) density despite ?.: foo?.(bar?.()) -> foo?.( bar?.() )', () => {
            ruleTester.run(RULE, rule, invalid(
                fix(
                    'foo?.(bar?.())',
                    'foo?.( bar?.() )',
                ),
            ));
        });
    });

    describe('custom threshold option', () => {

        it('triggers at threshold 2: foo([bar]) -> foo( [bar] ) with {threshold: 2}', () => {
            ruleTester.run(RULE, rule, {
                valid: [],
                invalid: [{
                    code: 'foo([bar])',
                    output: 'foo( [bar] )',
                    errors: 2,
                    options: [{ threshold: 2 }],
                }],
            });
        });

        it('allows 3 adjacent at threshold 4: foo([[bar]]) with {threshold: 4}', () => {
            ruleTester.run(RULE, rule, {
                valid: [{
                    code: 'foo([[bar]])',
                    options: [{ threshold: 4 }],
                }],
                invalid: [],
            });
        });
    });
});
