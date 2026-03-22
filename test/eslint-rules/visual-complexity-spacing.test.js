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
 *
 * Principle 6 (short inner content as independent trigger) is
 * documented in the formatting philosophy but handled implicitly
 * through content-length suppression. The rule does not have a
 * separate short-content check. foo(bar(baz)) with 3-char
 * content is currently spaced (callee 'bar' is only 3 chars).
 * This may be revisited as a separate enhancement.
 *
 * Principle 14 (operator-adjacent spacing) is intentionally out
 * of scope — it belongs in a separate companion rule.
 *
 * Glossary:
 * - pile-up: 3+ grouping characters (parens, brackets, braces, or dense
 *   trailing chars like ; . !) adjacent without whitespace. E.g., )), ]], }).
 * - anchoring: when a long identifier name (5+ chars for methods, 8+ for
 *   standalone callees) provides enough visual separation that spacing
 *   becomes optional at statement end.
 * - skips vs fixes: "skips" = the rule does not add spaces (valid case).
 *   "fixes" = the rule inserts spaces (invalid case, autofix applied).
 */

import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from
    '../../.config/eslint-rules/visual-complexity-spacing.js';

/*
 * Principle mapping (see user_grouping_char_spacing_philosophy.md):
 *   P1  -> brackets that pile up
 *   P2  -> semicolons and trailing punctuation
 *   P3  -> chained .method() or [index]
 *   P4  -> long names make spacing optional
 *   P5  -> empty call inside other brackets
 *   P7  -> completing partially-spaced brackets
 *   P8  -> nested bracket access
 *   P9  -> template literal expressions
 *   P10 -> multi-line expressions
 *   P11 -> concise arrow / block body (within P10 and arrow sections)
 *   P12 -> concise arrow inside calls
 *   P13 -> commas provide visual separation
 *   P6  -> (implicit, see header note)
 *   P14 -> (separate companion rule, not implemented here)
 */

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
const FN_NAME_DESC = 'long names make spacing optional at statement end: callback(obj.method())';
const MULTI_ARG_DESC = 'commas provide visual separation in multi-arg calls';

describe('visual-complexity-spacing', () => {

    describe('brackets that pile up: foo([[bar]])', () => {

        it('skips 2 brackets: foo([bar])', () => {
            const cases = [
                'foo([bar])',
                'foo({bar: 1})',
                'arr.push([1, 2])',
            ];
            ruleTester.run(RULE, rule, valid(...cases));
        });

        it('fixes setState([[initialRow]])', () => {
            const code = 'setState([[initialRow]])';
            const output = 'setState( [[initialRow]] )';
            ruleTester.run(RULE, rule, invalid(expectFix(code, output)));
        });

        it('fixes db.insert([{name: val}])', () => {
            const code = 'db.insert([{name: val}])';
            const output = 'db.insert( [{name: val}] )';
            ruleTester.run(RULE, rule, invalid(expectFix(code, output)));
        });

        it('fixes run(init(setup()))', () => {
            const code = 'run(init(setup()))';
            const output = 'run( init(setup()) )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes ({  pile-up at argument start', () => {
            const code = 'setup({key: fn()}, x)';
            const output = 'setup( {key: fn()}, x )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes log(pad(trim()), suffix) multi-arg pile-up', () => {
            const code = "log(pad(trim()), 'left')";
            const output = "log( pad(trim()), 'left' )";
            ruleTester.run(
                RULE, rule, invalid(expectFix(code, output))
            );
        });

        it('skips already-spaced expressions', () => {
            const cases = [
                'setState( [[initialRow]] )',
                'db.insert( [{name: val}] )',
                'run( init(setup()) )',
                'parseInt( getValue() )',
            ];
            ruleTester.run(RULE, rule, valid(...cases));
        });

        it('fixes new + nested constructor', () => {
            const code = 'new Set(new Map([]))';
            const output = 'new Set( new Map([]) )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes spread + nested calls', () => {
            const code = 'foo(...bar(baz()))';
            const output = 'foo( ...bar(baz()) )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes app.use(cors(config(defaults())))', () => {
            const code = 'app.use(cors(config(defaults())))';
            const output = 'app.use( cors(config(defaults())) )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes Object.keys({})', () => {
            const f = expectFix(
                'Object.keys({})', 'Object.keys( {} )'
            );
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes Array.from([])', () => {
            const f = expectFix(
                'Array.from([])', 'Array.from( [] )'
            );
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes parseInt(getValue())', () => {
            const code = 'parseInt(getValue())';
            const output = 'parseInt( getValue() )';
            ruleTester.run(RULE, rule, invalid(expectFix(code, output)));
        });

        it('fixes Promise.all([fetch(a), fetch(b)])', () => {
            const code = 'Promise.all([fetch(a), fetch(b)])';
            const output = 'Promise.all( [fetch(a), fetch(b)] )';
            ruleTester.run(
                RULE, rule, invalid(expectFix(code, output))
            );
        });
    });

    describe('completing partially-spaced brackets: foo( [[bar]])', () => {

        it('fixes missing close space', () => {
            const f = expectFix(
                'foo( [[bar]])', 'foo( [[bar]] )', 1
            );
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes missing open space', () => {
            const f = expectFix(
                'foo([[bar]] )', 'foo( [[bar]] )', 1
            );
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('multi-line expressions', () => {

        it('skips when line breaks separate', () => {
            ruleTester.run(
                RULE, rule, valid('foo(\n    bar()\n);')
            );
        });

        it('fixes close side only when cluster is single-line', () => {
            const f = expectFix(
                'foo(\n    bar())', 'foo(\n    bar() )', 1
            );
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('skips callback with block body', () => {
            const code =
                'setTimeout(() => {\n    doStuff();\n});';
            ruleTester.run(RULE, rule, valid(code));
        });
    });

    describe('template literal ${} expressions', () => {

        it('skips ${} without grouping chars', () => {
            ruleTester.run(
                RULE, rule, valid('`${name}`', '`${obj.name}`')
            );
        });

        it('fixes ${} with call inside', () => {
            const f = expectFix(
                '`${getName()}`', '`${ getName() }`'
            );
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes ${} with bracket access', () => {
            const f = expectFix(
                '`${items[0]}`', '`${ items[0] }`'
            );
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes ${} with method call', () => {
            const f = expectFix(
                '`${obj().name}`', '`${ obj().name }`'
            );
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes multiple ${} expressions in one literal', () => {
            const code = '`${fn()} and ${bar()}`';
            const output = '`${ fn() } and ${ bar() }`';
            const f = expectFix(code, output, 4);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes ${} with nested call', () => {
            const f = expectFix(
                '`${fn(bar())}`', '`${ fn(bar()) }`'
            );
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

        it('fixes require(resolve(path))(config)', () => {
            const code = "require(resolve('./module'))('./config')";
            const output =
                "require( resolve('./module') )('./config')";
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        // eslint-disable-next-line @stylistic/max-len
        it('fixes chained access even with long names: callback(obj.method()).next()', () => {
            const code = 'callback(obj.method()).next()';
            const output = 'callback( obj.method() ).next()';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('semicolons and trailing punctuation', () => {

        it('skips 2 brackets + semicolon', () => {
            ruleTester.run(RULE, rule, valid('foo(bar);'));
        });

        it('fixes )); at statement end', () => {
            const f = expectFix(
                'emit(parse());', 'emit( parse() );'
            );
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes !( prefix in condition', () => {
            const code = 'if (!(foo || bar)) { }';
            const output = 'if ( !(foo || bar) ) { }';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes await with short nested call', () => {
            const code = 'await emit(parse());';
            const output = 'await emit( parse() );';
            ruleTester.run(RULE, rule, invalid(expectFix(code, output)));
        });

        it('fixes if (has(get(key))) condition', () => {
            const code = 'if (has(get(key))) {}';
            const output = 'if ( has(get(key)) ) {}';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes while (has(next())) condition', () => {
            const code = 'while (has(next())) {}';
            const output = 'while ( has(next()) ) {}';
            const f = expectFix(code, output);
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
            ruleTester.run(RULE, rule, valid(...cases));
        });

        it('skips block body function expressions', () => {
            const cases = [
                'foo(function(){ bar(); });',
                'foo(function handler(){ bar(); });',
            ];
            ruleTester.run(RULE, rule, valid(...cases));
        });

        it('fixes each arrow call in a chain', () => {
            const code = 'items.map(x => parse(x)).filter(y => validate(y))';
            // eslint-disable-next-line @stylistic/max-len
            const output = 'items.map( x => parse(x) ).filter( y => validate(y) )';
            ruleTester.run(RULE, rule, invalid(expectFix(code, output, 4)));
        });

        it('skips arrow with non-call body', () => {
            ruleTester.run(
                RULE, rule, valid('arr.map(x => x.name)')
            );
        });

        it('fixes arrow returning parenthesized object', () => {
            const code = 'arr.map(x => ({key: x}))';
            const output = 'arr.map( x => ({key: x}) )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes arrow with call body + multiple params', () => {
            const code = 'arr.forEach((x, i) => process(x))';
            const output =
                'arr.forEach( (x, i) => process(x) )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes multiple arrows in same call', () => {
            const code =
                'race(x => fetch(x), y => cache(y))';
            const output =
                'race( x => fetch(x), y => cache(y) )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe(FN_NAME_DESC, () => {

        it('skips long obj.method() name', () => {
            ruleTester.run(
                RULE, rule, valid('callback(obj.method());')
            );
        });

        it('skips long callee name (8+ chars)', () => {
            const cases = valid(
                'getData(parseResponse(result));'
            );
            ruleTester.run(RULE, rule, cases);
        });

        it('fixes short names at statement end', () => {
            const f = expectFix(
                'foo(bar(x));', 'foo( bar(x) );'
            );
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes short obj.method at statement end', () => {
            const code = 'wrap(ab.cdef(data));';
            const output = 'wrap( ab.cdef(data) );';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes short inner callee despite long outer', () => {
            const f = expectFix(
                'callback(fn(x));', 'callback( fn(x) );'
            );
            ruleTester.run(RULE, rule, invalid(f));
        });

        // MIN_METHOD_LEN_STANDALONE = 5: 'parse' is 5 chars
        it('skips 5+ char method with short object', () => {
            ruleTester.run(
                RULE, rule, valid('wrap(pa.parse(data));')
            );
        });

        // MIN_OBJ_LEN_FOR_ANCHORING=5 + MIN_METHOD_LEN_WITH_LONG_OBJ=4
        it('skips obj=5 method=4 (long object offsets short method)', () => {
            ruleTester.run(
                RULE, rule, valid('wrap(items.find(data));')
            );
        });

        // obj 'item' = 4 chars, below MIN_OBJ_LEN_FOR_ANCHORING
        it('fixes obj=4, method=4 (too short)', () => {
            const code = 'wrap(item.find(data));';
            const output = 'wrap( item.find(data) );';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        // MIN_CALLEE_LEN_FOR_SUPPRESSION = 8: 'abcdefgh' is exactly 8
        it('skips inner callee exactly 8 chars', () => {
            ruleTester.run(
                RULE, rule, valid('a(abcdefgh(x));')
            );
        });

        // 'abcdefg' = 7, below MIN_CALLEE_LEN_FOR_SUPPRESSION
        it('fixes inner callee 7 chars (too short)', () => {
            const f = expectFix(
                'a(abcdefg(x));', 'a( abcdefg(x) );'
            );
            ruleTester.run(RULE, rule, invalid(f));
        });

        // MIN_CONTENT_LEN_FOR_SUPPRESSION = 15
        it('skips when content >= 15 chars (no inner callee)', () => {
            ruleTester.run(
                RULE, rule, valid('fn({longValueStri});')
            );
        });

        // content 'longValueStr' + braces = 14, below threshold
        it('fixes when content < 15 chars (no inner callee)', () => {
            const code = 'fn({longValueStr});';
            const output = 'fn( {longValueStr} );';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('nested bracket access: obj[arr[index]]', () => {

        it('skips short nested access', () => {
            ruleTester.run(
                RULE, rule, valid('obj[arr[index]]')
            );
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

        // eslint-disable-next-line @stylistic/max-len
        it('skips inner name exactly 10 chars (MIN_BRACKET_INNER_LEN boundary)', () => {
            // eslint-disable-next-line @stylistic/max-len
            ruleTester.run(RULE, rule, valid('obj[abcdefghij[longPropertyName]]'));
        });

        it('fixes inner name 9 chars (below MIN_BRACKET_INNER_LEN)', () => {
            const code = 'obj[abcdefghi[longPropertyName]]';
            const output = 'obj[ abcdefghi[longPropertyName] ]';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        // eslint-disable-next-line @stylistic/max-len
        it('skips outer name exactly 10 chars (MIN_BRACKET_OUTER_LEN boundary)', () => {
            // eslint-disable-next-line @stylistic/max-len
            ruleTester.run(RULE, rule, valid('abcdefghij[arr[longPropertyName]]'));
        });

        it('fixes outer name 9 chars (below MIN_BRACKET_OUTER_LEN)', () => {
            const code = 'abcdefghi[arr[longPropertyName]]';
            const output = 'abcdefghi[ arr[longPropertyName] ]';
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
            ruleTester.run(
                RULE, rule, invalid(expectFix(code, output))
            );
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

        it('fixes callbacks[getName()]', () => {
            const code = 'callbacks[getName()]';
            const output = 'callbacks[ getName() ]';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });
    });

    describe('real-world patterns', () => {

        // eslint-disable-next-line @stylistic/max-len
        it('fixes Object.keys chained: Object.keys(getConfig()).forEach(fn)', () => {
            const code = 'Object.keys(getConfig()).forEach(fn)';
            const output = 'Object.keys( getConfig() ).forEach(fn)';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes Array.from with nested constructor', () => {
            const code = 'Array.from(new Set([...items]))';
            const output =
                'Array.from( new Set([...items]) )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes require(resolve()) with semicolon', () => {
            const code = "require(resolve('./path'));";
            const output = "require( resolve('./path') );";
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes assert(equal()) with semicolon', () => {
            const code = 'assert(equal(a, b));';
            const output = 'assert( equal(a, b) );';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes ternary with nested call', () => {
            const code = 'const x = cond ? fn(bar()) : baz';
            const output =
                'const x = cond ? fn( bar() ) : baz';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes arrow with destructured param', () => {
            const code = 'arr.forEach(({name}) => process(name))';
            const output = 'arr.forEach( ({name}) => process(name) )';
            const f = expectFix(code, output);
            ruleTester.run(RULE, rule, invalid(f));
        });

        it('fixes tagged template with nested call', () => {
            const f = expectFix('html`${fn(bar())}`', 'html`${ fn(bar()) }`');
            ruleTester.run(RULE, rule, invalid(f));
        });

        // eslint-disable-next-line @stylistic/max-len
        it('skips JSON.parse(JSON.stringify(obj)) -- inner callee anchors', () => {
            // eslint-disable-next-line @stylistic/max-len
            ruleTester.run(RULE, rule, valid('JSON.parse(JSON.stringify(obj))'));
        });

        it('skips console.log(obj.method()) -- member callee anchors', () => {
            ruleTester.run(RULE, rule, valid('console.log(obj.method());'));
        });

        it('skips return fn(bar()) inside function body', () => {
            // eslint-disable-next-line @stylistic/max-len
            ruleTester.run(RULE, rule, valid('function x() { return fn(bar()); }'));
        });

        // eslint-disable-next-line @stylistic/max-len
        it('skips assert(equal(a, b)) without semicolon -- below threshold', () => {
            ruleTester.run(RULE, rule, valid('assert(equal(a, b))'));
        });
    });

    describe('comments between grouping characters', () => {

        it('skips when comment breaks adjacency', () => {
            ruleTester.run(RULE, rule, valid('foo(bar()/* comment */)'));
        });
    });

    describe('optional chaining', () => {

        it('fixes )) pile-up with ?.', () => {
            const f = expectFix(
                'foo?.(bar?.())', 'foo?.( bar?.() )'
            );
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

        it('skips empty container fn() at threshold 2', () => {
            ruleTester.run(RULE, rule, {
                valid: [{
                    code: 'fn()',
                    options: [{ threshold: 2 }],
                }],
                invalid: [],
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

    describe('fix idempotency', () => {

        it('skips already-fixed output (re-running produces no errors)', () => {
            const fixOutputs = [
                'setState( [[initialRow]] )',
                'db.insert( [{name: val}] )',
                'run( init(setup()) )',
                'app.use( cors(config(defaults())) )',
                'Object.keys( {} )',
                'Array.from( [] )',
                'parseInt( getValue() )',
                "require( resolve('./module') )('./config')",
                'if ( has(get(key)) ) {}',
                'arr.map( x => ({key: x}) )',
                'emit( parse() );',
                'wrap( parse(data) ).unwrap()',
                'foo(\n    bar() )',
                'fn( sh(longArg) );',
                'fn( {longValueStr} );',
                'callback( obj.method() ).next()',
                '`${ fn(bar()) }`',
                'arr.forEach( (x, i) => process(x) )',
                'race( x => fetch(x), y => cache(y) )',
                'Object.keys( getConfig() ).forEach(fn)',
                'Array.from( new Set([...items]) )',
                "require( resolve('./path') );",
                'assert( equal(a, b) );',
                'const x = cond ? fn( bar() ) : baz',
                'arr.forEach( ({name}) => process(name) )',
                'html`${ fn(bar()) }`',
                'obj[ abcdefghi[longPropertyName] ]',
                'abcdefghi[ arr[longPropertyName] ]',
            ];
            ruleTester.run(RULE, rule, valid(...fixOutputs));
        });
    });
});
