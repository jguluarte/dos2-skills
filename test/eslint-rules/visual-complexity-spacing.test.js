/**
 * Tests for the visual-complexity-spacing ESLint rule.
 *
 * This rule adds spaces inside the outermost bracket when
 * 3+ grouping characters (parens, brackets, braces, plus
 * ; . !) pile up without whitespace.
 *
 * Example: foo([[bar]]) becomes foo( [[bar]] ).
 *
 * It accounts for chained access, template literals, arrow
 * functions, function name length, and argument count to
 * decide when spacing is needed vs when the code is already
 * readable without it.
 */

import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from
    '../../.config/eslint-rules/visual-complexity-spacing.js';

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

/**
 * Build an invalid test case expecting autofix.
 *
 * Default errors = 2 because most fixes insert a space on
 * both the open side and the close side — each is reported
 * as a separate violation.
 */
function expectFix(code, output, errors = 2) {
    return { code, output, errors };
}

// eslint-disable-next-line @stylistic/max-len
const FN_NAME_DESC = 'long names suppress spacing at statement end: callback(obj.method())';
const MULTI_ARG_DESC = 'multiple arguments absorb closing pile-up';

describe('visual-complexity-spacing', () => {

    describe('brackets that pile up: foo([[bar]])', () => {

        it('skips 2 brackets: foo([bar])', () => {
            const cases = [
                'foo([bar])',
                'foo({bar: 1})',
                'arr.push([1, 2])',
            ];
            ruleTester.run(RULE, rule, { valid: cases, invalid: [] });
        });

        it('fixes foo([[bar]]) -> foo( [[bar]] )', () => {
            const f = expectFix('foo([[bar]])', 'foo( [[bar]] )');
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes foo([{key: 1}]) -> foo( [{key: 1}] )', () => {
            const f = expectFix('foo([{key: 1}])', 'foo( [{key: 1}] )');
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes a(b(c())) -> a( b(c()) )', () => {
            const f = expectFix('a(b(c()))', 'a( b(c()) )');
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes ({  pile-up at argument start', () => {
            const code = 'setup({key: fn()}, x)';
            const output = 'setup( {key: fn()}, x )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes triple-nested calls', () => {
            const code = "outer(mid(inner()), 'x')";
            const output = "outer( mid(inner()), 'x' )";
            ruleTester.run(RULE, rule, invalid(expectFix(code, output)));
        });

        it('skips already-spaced expressions', () => {
            const cases = [
                'foo( [[bar]] )',
                'foo( [{key: 1}] )',
                'foo( bar([baz]) )',
                'foo( bar() );',
            ];
            ruleTester.run(RULE, rule, { valid: cases, invalid: [] });
        });

        it('fixes new + nested constructor', () => {
            const code = 'new Set(new Map([]))';
            const output = 'new Set( new Map([]) )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes spread + nested calls', () => {
            const f = expectFix('foo(...bar(baz()))', 'foo( ...bar(baz()) )');
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('completing partially-spaced brackets: foo( [[bar]])', () => {

        it('fixes missing close space', () => {
            const f = expectFix('foo( [[bar]])', 'foo( [[bar]] )', 1);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes missing open space', () => {
            const f = expectFix('foo([[bar]] )', 'foo( [[bar]] )', 1);
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('multi-line expressions', () => {

        it('skips when line breaks separate', () => {
            ruleTester.run(RULE, rule, valid('foo(\n    bar()\n);'));
        });

        it('skips callback with block body', () => {
            const code = 'setTimeout(() => {\n    doStuff();\n});';
            ruleTester.run(RULE, rule, valid(code));
        });
    });

    describe('template literal ${} expressions', () => {

        it('skips ${} without grouping chars', () => {
            ruleTester.run(RULE, rule, valid('`${name}`', '`${obj.name}`'));
        });

        it('fixes ${} with call inside', () => {
            const f = expectFix('`${getName()}`', '`${ getName() }`');
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes ${} with bracket access', () => {
            const f = expectFix('`${items[0]}`', '`${ items[0] }`');
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes ${} with method call', () => {
            const f = expectFix('`${obj().name}`', '`${ obj().name }`');
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('chained .method() or [index] after nested calls', () => {

        it('fixes .method() after nested parens', () => {
            const code = 'wrap(parse(data)).unwrap()';
            const output = 'wrap( parse(data) ).unwrap()';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes [index] after nested parens', () => {
            const code = 'getMap(buildKey(userId))[0]';
            const output = 'getMap( buildKey(userId) )[0]';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('skips already-spaced chained access', () => {
            ruleTester.run(RULE, rule, valid('wrap( parse(data) ).unwrap()'));
        });
    });

    describe('semicolons and trailing punctuation', () => {

        it('skips 2 brackets + semicolon', () => {
            ruleTester.run(RULE, rule, valid('foo(bar);'));
        });

        it('fixes )); at statement end', () => {
            const f = expectFix('foo(bar());', 'foo( bar() );');
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes !( prefix in condition', () => {
            const code = 'if (!(foo || bar)) { }';
            const output = 'if ( !(foo || bar) ) { }';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes await with short nested call', () => {
            const f = expectFix('await foo(bar());', 'await foo( bar() );');
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('concise arrow inside calls: arr.map(x => f(x))', () => {

        it('fixes arrow with call body', () => {
            const code = 'skills.forEach(skill => renderCard(skill))';
            const output = 'skills.forEach( skill => renderCard(skill) )';
            ruleTester.run(RULE, rule, invalid(expectFix(code, output)));
        });

        it('skips block body arrows', () => {
            const cases = [
                'foo(() => { bar() })',
                'foo(()=>{ bar(); });',
            ];
            ruleTester.run(RULE, rule, { valid: cases, invalid: [] });
        });

        it('skips block body function expressions', () => {
            const cases = [
                'foo(function(){ bar(); });',
                'foo(function handler(){ bar(); });',
            ];
            ruleTester.run(RULE, rule, { valid: cases, invalid: [] });
        });

        it('fixes each arrow call in a chain', () => {
            const code = 'arr.map(x => f(x)).filter(y => g(y))';
            const output = 'arr.map( x => f(x) ).filter( y => g(y) )';
            ruleTester.run(RULE, rule, invalid(expectFix(code, output, 4)));
        });

        it('skips arrow with non-call body', () => {
            ruleTester.run(RULE, rule, valid('arr.map(x => x.name)'));
        });
    });

    describe(FN_NAME_DESC, () => {

        it('skips long obj.method() name', () => {
            ruleTester.run(RULE, rule, valid('callback(obj.method());'));
        });

        it('skips long callee name (8+ chars)', () => {
            const cases = valid('getData(parseResponse(result));');
            ruleTester.run(RULE, rule, cases);
        });

        it('fixes short names at statement end', () => {
            const f = expectFix('foo(bar(x));', 'foo( bar(x) );');
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes short obj.method at statement end', () => {
            const code = 'wrap(ab.cdef(data));';
            const output = 'wrap( ab.cdef(data) );';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes short inner callee despite long outer', () => {
            const f = expectFix('callback(fn(x));', 'callback( fn(x) );');
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('skips 5+ char method with short object', () => {
            ruleTester.run(RULE, rule, valid('wrap(pa.parse(data));'));
        });

        it('skips obj=5 method=4 (long object absorbs short method)', () => {
            ruleTester.run(RULE, rule, valid('wrap(items.find(data));'));
        });

        it('fixes obj=4, method=4 (too short)', () => {
            const code = 'wrap(item.find(data));';
            const output = 'wrap( item.find(data) );';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('skips inner callee exactly 8 chars', () => {
            ruleTester.run(RULE, rule, valid('a(abcdefgh(x));'));
        });

        it('fixes inner callee 7 chars (too short)', () => {
            const f = expectFix('a(abcdefg(x));', 'a( abcdefg(x) );');
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('nested bracket access: obj[arr[index]]', () => {

        it('skips short nested access', () => {
            ruleTester.run(RULE, rule, valid('obj[arr[index]]'));
        });

        it('skips long outer name (10+ chars)', () => {
            ruleTester.run(RULE, rule, valid('obj[longArrayName[index]]'));
        });

        it('fixes long inner content', () => {
            const code = 'obj[arr[longPropertyName]]';
            const output = 'obj[ arr[longPropertyName] ]';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe(MULTI_ARG_DESC, () => {

        it('skips multi-arg with nested call', () => {
            ruleTester.run(RULE, rule, valid('foo(data, parse());'));
        });

        it('fixes single-arg nested call', () => {
            const f = expectFix('foo(parse());', 'foo( parse() );');
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes 3+ pile-up in multi-arg', () => {
            const code = 'foo(data, bar(parse()));';
            const output = 'foo( data, bar(parse()) );';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes ])) in multi-arg call', () => {
            /* eslint-disable @stylistic/max-len */
            const code = 'buildSummaryText(null, new Set([WARFARE, NECROMANCER]))';
            const output = 'buildSummaryText( null, new Set([WARFARE, NECROMANCER]) )';
            /* eslint-enable @stylistic/max-len */
            ruleTester.run(RULE, rule, invalid(expectFix(code, output)));
        });

        it('fixes single-arg object with commas', () => {
            const f = expectFix('foo({a: 1, b: 2});', 'foo( {a: 1, b: 2} );');
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('empty call inside other brackets: callbacks[getName()]', () => {

        it('skips fn()() (double invocation)', () => {
            ruleTester.run(RULE, rule, valid('fn()()'));
        });

        it('fixes callbacks[getName()] -> callbacks[ getName() ]', () => {
            const code = 'callbacks[getName()]';
            const output = 'callbacks[ getName() ]';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('real-world patterns', () => {

        it('fixes Promise.all with fetch calls', () => {
            const code = 'Promise.all([fetch(a), fetch(b)])';
            const output = 'Promise.all( [fetch(a), fetch(b)] )';
            ruleTester.run(RULE, rule, invalid(expectFix(code, output)));
        });
    });

    describe('comments between grouping characters', () => {

        it('skips when comment breaks adjacency', () => {
            ruleTester.run(RULE, rule, valid('foo(bar()/* comment */)'));
        });
    });

    describe('optional chaining', () => {

        it('fixes )) pile-up with ?.', () => {
            const f = expectFix('foo?.(bar?.())', 'foo?.( bar?.() )');
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('custom threshold option', () => {

        it('fixes at threshold 2', () => {
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

        it('skips 3 pile-up at threshold 4', () => {
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
