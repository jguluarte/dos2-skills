/**
 * Tests for the visual-complexity-spacing ESLint rule.
 *
 * This rule adds spaces inside the outermost bracket when
 * 3+ grouping characters (parens, brackets, braces, plus
 * ; . !) pile up without whitespace.
 *
 * Example: setState([[initialRow]]) becomes setState( [[initialRow]] ).
 *
 * Structure:
 * 1. Behavior tests — what the rule does at default config,
 *    organized by principle, using real-world code patterns
 * 2. Configuration tests — how changing options changes behavior
 * 3. Boundary tests — at exactly N, behavior flips (per constant)
 * 4. Fix idempotency — every fix output re-validates as valid
 *
 * P6 is handled implicitly through callee-length suppression;
 * no separate short-content check exists.
 *
 * Principle 14 (operator-adjacent spacing) is intentionally out
 * of scope — it belongs in a separate companion rule.
 *
 * Glossary:
 * - pile-up: 3+ grouping characters (parens, brackets, braces, or dense
 *   trailing chars like ; . !) adjacent without whitespace.
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

const RULE = 'visual-complexity-spacing';

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
});

function validOnly(...cases) {
    return { valid: cases, invalid: [] };
}

function invalidOnly(...cases) {
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

// -------------------------------------------------------
// 1. Default behavior (threshold=3)
// -------------------------------------------------------

describe('visual-complexity-spacing', () => {

    describe('default behavior (threshold=3)', () => {

        describe('P1: 3+ adjacent grouping chars', () => {

            it('skips 2 brackets — arr.push([1, 2])', () => {
                const cases = [
                    'arr.push([1, 2])',
                    'res.json({status: ok})',
                    'grid.set([startX])',
                ];
                ruleTester.run(RULE, rule, validOnly(...cases));
            });

            it('fixes [[ — setState([[initialRow]])', () => {
                const code = 'setState([[initialRow]])';
                const output = 'setState( [[initialRow]] )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes [{ — db.insert([{name: val}])', () => {
                const code = 'db.insert([{name: val}])';
                const output = 'db.insert( [{name: val}] )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes triple nested — app.use(cors(config(...)))', () => {
                const code = 'app.use(cors(config(defaults())))';
                const output = 'app.use( cors(config(defaults())) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes ({ at arg start — setup({key: fn()}, x)', () => {
                const code = 'setup({key: fn()}, x)';
                const output = 'setup( {key: fn()}, x )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes multi-arg pile-up — log(pad(trim()), suffix)', () => {
                const code = "log(pad(trim()), 'left')";
                const output = "log( pad(trim()), 'left' )";
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('skips already-spaced expressions', () => {
                const cases = [
                    'setState( [[initialRow]] )',
                    'db.insert( [{name: val}] )',
                    'app.use( cors(config(defaults())) )',
                    'parseInt( getValue() )',
                ];
                ruleTester.run(RULE, rule, validOnly(...cases));
            });

            it('fixes new + nested — new Set(new Map([]))', () => {
                const code = 'new Set(new Map([]))';
                const output = 'new Set( new Map([]) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes spread — emit(...parse(getBody()))', () => {
                const code = 'emit(...parse(getBody()))';
                const output = 'emit( ...parse(getBody()) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes empty object — Object.keys({})', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('Object.keys({})', 'Object.keys( {} )')
                ));
            });

            it('fixes empty array — Array.from([])', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('Array.from([])', 'Array.from( [] )')
                ));
            });

            it('fixes nested call — parseInt(getValue())', () => {
                const code = 'parseInt(getValue())';
                const output = 'parseInt( getValue() )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes array of calls — Promise.all([fetch()])', () => {
                const code = 'Promise.all([fetch(a), fetch(b)])';
                const output = 'Promise.all( [fetch(a), fetch(b)] )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes triple nested short — run(init(setup()))', () => {
                const code = 'run(init(setup()))';
                const output = 'run( init(setup()) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });
        });

        describe('P2: semicolons and trailing punctuation', () => {

            it('skips ); — only 2 chars: res.send(data);', () => {
                ruleTester.run(RULE, rule, validOnly('res.send(data);'));
            });

            it('fixes )); — emit(parse());', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('emit(parse());', 'emit( parse() );')
                ));
            });

            it('fixes !( in condition — if (!(a || b))', () => {
                const code = 'if (!(req.body || req.query)) { }';
                const output = 'if ( !(req.body || req.query) ) { }';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes await does not suppress pile-up', () => {
                const code = 'await emit(parse());';
                const output = 'await emit( parse() );';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes ))) in if — if (has(get(key)))', () => {
                const code = 'if (has(get(key))) {}';
                const output = 'if ( has(get(key)) ) {}';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes ))) in while — while (has(next()))', () => {
                const code = 'while (has(next())) {}';
                const output = 'while ( has(next()) ) {}';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });
        });

        describe('P3: chained .method() or [index] after ))', () => {

            it('fixes .method() — wrap(parse(data)).unwrap()', () => {
                const code = 'wrap(parse(data)).unwrap()';
                const output = 'wrap( parse(data) ).unwrap()';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes [0] — getMap(buildKey(userId))[0]', () => {
                const code = 'getMap(buildKey(userId))[0]';
                const output = 'getMap( buildKey(userId) )[0]';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('skips already-spaced chain', () => {
                const code = 'wrap( parse(data) ).unwrap()';
                ruleTester.run(RULE, rule, validOnly(code));
            });

            it('fixes immediate invocation after ))', () => {
                const code = "require(resolve('./module'))('./config')";
                const output =
                    "require( resolve('./module') )('./config')";
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes chain overrides long callee anchoring', () => {
                const code = 'callback(obj.method()).next()';
                const output = 'callback( obj.method() ).next()';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes .forEach(fn) — Object.keys(getConfig())', () => {
                const code = 'Object.keys(getConfig()).forEach(fn)';
                const output =
                    'Object.keys( getConfig() ).forEach(fn)';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });
        });

        describe('P4: long names suppress spacing at statement end', () => {

            it('skips long member callee — callback(obj.method());', () => {
                ruleTester.run(
                    RULE, rule, validOnly('callback(obj.method());')
                );
            });

            it('skips 8+ char standalone callee', () => {
                ruleTester.run(
                    RULE, rule, validOnly('getData(parseResponse(result));')
                );
            });

            it('fixes short callee — emit(parse());', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('emit(parse());', 'emit( parse() );')
                ));
            });

            it('skips long inner callee — JSON.parse(JSON.stringify())', () => {
                const code = 'JSON.parse(JSON.stringify(obj))';
                ruleTester.run(RULE, rule, validOnly(code));
            });

            it('skips member callee — console.log(obj.method());', () => {
                const code = 'console.log(obj.method());';
                ruleTester.run(RULE, rule, validOnly(code));
            });

            it('fixes short inner despite long outer', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('callback(fn(x));', 'callback( fn(x) );')
                ));
            });
        });

        describe('P5: empty call inside brackets', () => {

            it('skips double invocation — createApp()()', () => {
                ruleTester.run(RULE, rule, validOnly('fn()()'));
            });

            it('fixes empty call in brackets — callbacks[getName()]', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('callbacks[getName()]', 'callbacks[ getName() ]')
                ));
            });
        });

        describe('P6: short inner content (implicit via anchoring)', () => {

            it('fixes 1-char arg — set(get(x));', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('set(get(x));', 'set( get(x) );')
                ));
            });

            it('fixes 2-char arg — set(get(id));', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('set(get(id));', 'set( get(id) );')
                ));
            });

            // 3-char arg still fixes because callee 'get' is only
            // 3 chars — below MIN_CALLEE_LEN_FOR_SUPPRESSION.
            // This is the P6 gap.
            it('fixes 3-char arg (P6 gap) — set(get(url));', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('set(get(url));', 'set( get(url) );')
                ));
            });
        });

        describe('P7: completing partially-spaced brackets', () => {

            it('fixes half-spaced open — setState( [[rows]])', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('setState( [[rows]])', 'setState( [[rows]] )', 1)
                ));
            });

            it('fixes half-spaced close — setState([[rows]] )', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('setState([[rows]] )', 'setState( [[rows]] )', 1)
                ));
            });
        });

        describe('P8: nested bracket access — obj[arr[index]]', () => {

            it('skips short content — obj[arr[index]]', () => {
                ruleTester.run(
                    RULE, rule, validOnly('obj[arr[index]]')
                );
            });

            it('skips long inner name anchors', () => {
                ruleTester.run(
                    RULE, rule, validOnly('obj[longArrayName[index]]')
                );
            });

            it('fixes long property with short accessor', () => {
                const code = 'obj[arr[longPropertyName]]';
                const output = 'obj[ arr[longPropertyName] ]';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });
        });

        describe('P9: template literal ${} expressions', () => {

            it('skips simple interpolation — `${name}`', () => {
                ruleTester.run(
                    RULE, rule, validOnly('`${name}`', '`${obj.name}`')
                );
            });

            it('fixes call piles with } — `${getName()}`', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('`${getName()}`', '`${ getName() }`')
                ));
            });

            it('fixes bracket access piles — `${items[0]}`', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('`${items[0]}`', '`${ items[0] }`')
                ));
            });

            it('fixes method call piles — `${obj().name}`', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('`${obj().name}`', '`${ obj().name }`')
                ));
            });

            it('fixes each ${} independently', () => {
                const code = '`${fn()} and ${bar()}`';
                const output = '`${ fn() } and ${ bar() }`';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output, 4))
                );
            });

            it('fixes nested call in ${} — `${fn(bar())}`', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('`${fn(bar())}`', '`${ fn(bar()) }`')
                ));
            });

            it('fixes tagged template — html`${fn(bar())}`', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('html`${fn(bar())}`', 'html`${ fn(bar()) }`')
                ));
            });
        });

        describe('P10/P11: multi-line expressions', () => {

            it('skips newline breaks pile-up', () => {
                ruleTester.run(
                    RULE, rule, validOnly('foo(\n    bar()\n);')
                );
            });

            it('fixes close-side when open is on prior line', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('foo(\n    bar())', 'foo(\n    bar() )', 1)
                ));
            });

            it('skips block body — setTimeout(() => {...})', () => {
                const code =
                    'setTimeout(() => {\n    doStuff();\n});';
                ruleTester.run(RULE, rule, validOnly(code));
            });
        });

        describe('P11: block braces provide visual separation', () => {

            it('skips block body arrow — foo(() => { bar() })', () => {
                ruleTester.run(
                    RULE, rule, validOnly('foo(() => { bar() })')
                );
            });

            it('skips block body function expression', () => {
                const code = 'foo(function(){ bar(); });';
                ruleTester.run(RULE, rule, validOnly(code));
            });

            it('skips named function expression', () => {
                const code =
                    'foo(function handler(){ bar(); });';
                ruleTester.run(RULE, rule, validOnly(code));
            });

            it('skips block body separates pile-up at end', () => {
                const code = 'function x() '
                    + '{ return fn(bar()); }';
                ruleTester.run(RULE, rule, validOnly(code));
            });
        });

        describe('P12: concise arrow inside calls', () => {

            it('fixes arrow )) — forEach(skill => renderCard(skill))', () => {
                const code = 'skills.forEach(skill => renderCard(skill))';
                const output = 'skills.forEach( skill => renderCard(skill) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('skips block body arrow', () => {
                const cases = [
                    'foo(() => { bar() })',
                    'foo(()=>{ bar(); });',
                ];
                ruleTester.run(RULE, rule, validOnly(...cases));
            });

            it('skips function expression body', () => {
                const cases = [
                    'foo(function(){ bar(); });',
                    'foo(function handler(){ bar(); });',
                ];
                ruleTester.run(RULE, rule, validOnly(...cases));
            });

            it('fixes each arrow in chain — .map().filter()', () => {
                const code = 'items.map(x => parse(x))'
                    + '.filter(y => validate(y))';
                const output = 'items.map( x => parse(x) )'
                    + '.filter( y => validate(y) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output, 4))
                );
            });

            it('skips arrow property access — arr.map(x => x.name)', () => {
                ruleTester.run(
                    RULE, rule, validOnly('arr.map(x => x.name)')
                );
            });

            it('fixes arrow returning object — arr.map(x => ({...}))', () => {
                const code = 'arr.map(x => ({key: x}))';
                const output = 'arr.map( x => ({key: x}) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes tuple params — arr.forEach((x, i) => process(x))', () => {
                const code = 'arr.forEach((x, i) => process(x))';
                const output = 'arr.forEach( (x, i) => process(x) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes multiple arrows share outer call', () => {
                const code = 'race(x => fetch(x), y => cache(y))';
                const output = 'race( x => fetch(x), y => cache(y) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes destructured param adds (', () => {
                const code = 'arr.forEach(({name}) => process(name))';
                const output =
                    'arr.forEach( ({name}) => process(name) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });
        });

        describe('P13: commas provide visual separation', () => {

            it('skips comma separates nested call', () => {
                ruleTester.run(RULE, rule, validOnly('foo(data, parse());'));
            });

            it('fixes single-arg no comma — emit(parse());', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('emit(parse());', 'emit( parse() );')
                ));
            });

            it('fixes 3+ overrides comma', () => {
                const code = 'foo(data, bar(parse()));';
                const output = 'foo( data, bar(parse()) );';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes ])) mixed brackets in multi-arg', () => {
                const code = 'buildSummaryText(null, '
                    + 'new Set([WARFARE, NECROMANCER]))';
                const output = 'buildSummaryText( null, '
                    + 'new Set([WARFARE, NECROMANCER]) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes object arg commas are inside not between args', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('foo({a: 1, b: 2});', 'foo( {a: 1, b: 2} );')
                ));
            });
        });

        describe('comments between grouping characters', () => {

            it('skips comment breaks pile-up', () => {
                ruleTester.run(
                    RULE, rule, validOnly('foo(bar()/* comment */)')
                );
            });
        });

        describe('optional chaining', () => {

            it('fixes ?. counts as grouping — foo?.(bar?.())', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('foo?.(bar?.())', 'foo?.( bar?.() )')
                ));
            });
        });

        describe('additional real-world patterns', () => {

            it('fixes ])) — Array.from(new Set([...items]))', () => {
                const code = 'Array.from(new Set([...items]))';
                const output = 'Array.from( new Set([...items]) )';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes )); — require(resolve(path));', () => {
                const code = "require(resolve('./path'));";
                const output = "require( resolve('./path') );";
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes multi-arg inner — assert(equal(a, b));', () => {
                const code = 'assert(equal(a, b));';
                const output = 'assert( equal(a, b) );';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('fixes )) in ternary — cond ? fn(bar()) : fallback', () => {
                const code = 'const x = cond ? fn(bar()) : baz';
                const output = 'const x = cond ? fn( bar() ) : baz';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });

            it('skips )) at threshold — assert(equal(a, b))', () => {
                ruleTester.run(
                    RULE, rule, validOnly('assert(equal(a, b))')
                );
            });
        });
    });

    // -------------------------------------------------------
    // 2. Configuration options
    // -------------------------------------------------------

    describe('configuration options', () => {

        describe('threshold option', () => {

            it('default (threshold=3): skips 2 adjacent', () => {
                ruleTester.run(RULE, rule, {
                    valid: [{
                        code: 'arr.push([1, 2])',
                        options: [{ threshold: 3 }],
                    }],
                    invalid: [],
                });
            });

            it('default (threshold=3): fixes 3 adjacent', () => {
                ruleTester.run(RULE, rule, {
                    valid: [],
                    invalid: [{
                        code: 'setState([[initialRow]])',
                        output: 'setState( [[initialRow]] )',
                        errors: 2,
                        options: [{ threshold: 3 }],
                    }],
                });
            });

            it('threshold=2: fires on 2 adjacent', () => {
                ruleTester.run(RULE, rule, {
                    valid: [],
                    invalid: [{
                        code: 'res.json([items])',
                        output: 'res.json( [items] )',
                        errors: 2,
                        options: [{ threshold: 2 }],
                    }],
                });
            });

            it('threshold=2: still skips 1 bracket', () => {
                ruleTester.run(RULE, rule, {
                    valid: [{
                        code: 'fn()',
                        options: [{ threshold: 2 }],
                    }],
                    invalid: [],
                });
            });

            it('threshold=4: skips 3 adjacent', () => {
                ruleTester.run(RULE, rule, {
                    valid: [{
                        code: 'setState([[initialRow]])',
                        options: [{ threshold: 4 }],
                    }],
                    invalid: [],
                });
            });

            it('threshold=4: fires on 4 adjacent', () => {
                const code = 'app.use(cors(config(defaults())))';
                const output =
                    'app.use( cors(config(defaults())) )';
                ruleTester.run(RULE, rule, {
                    valid: [],
                    invalid: [{
                        code,
                        output,
                        errors: 2,
                        options: [{ threshold: 4 }],
                    }],
                });
            });
        });
    });

    // -------------------------------------------------------
    // 3. Suppression boundaries
    // -------------------------------------------------------

    describe('suppression boundaries', () => {

        // MIN_METHOD_LEN_STANDALONE = 5
        // A method name alone needs 5+ chars to anchor.
        describe('MIN_METHOD_LEN_STANDALONE (5)', () => {

            // parse = 5 chars = MIN_METHOD_LEN_STANDALONE
            it('skips at 5 — wrap(db.parse(data));', () => {
                ruleTester.run(
                    RULE, rule, validOnly('wrap(db.parse(data));')
                );
            });

            // find = 4 chars < MIN_METHOD_LEN_STANDALONE
            it('fixes at 4 — wrap(db.find(data));', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('wrap(db.find(data));', 'wrap( db.find(data) );')
                ));
            });
        });

        // MIN_OBJ_LEN_FOR_ANCHORING = 5
        // Object name must be 5+ for the shorter method
        // threshold (MIN_METHOD_LEN_WITH_LONG_OBJ=4) to apply.
        describe('MIN_OBJ_LEN_FOR_ANCHORING (5)', () => {

            // items=5, find=4: obj>=5 so method threshold=4
            it('skips obj=5, method=4 — wrap(items.find(data));', () => {
                ruleTester.run(
                    RULE, rule, validOnly('wrap(items.find(data));')
                );
            });

            // item=4, find=4: obj<5 so method needs 5+
            it('fixes obj=4, method=4 — wrap(item.find(data));', () => {
                const code = 'wrap(item.find(data));';
                const output = 'wrap( item.find(data) );';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });
        });

        // MIN_METHOD_LEN_WITH_LONG_OBJ = 4
        // When object is long (5+), method only needs 4 chars.
        describe('MIN_METHOD_LEN_WITH_LONG_OBJ (4)', () => {

            // items=5, find=4: total 9+ chars of context
            it('skips obj=5, method=4 — wrap(items.find(data));', () => {
                ruleTester.run(
                    RULE, rule, validOnly('wrap(items.find(data));')
                );
            });

            // items=5, get=3: method too short even with long obj
            it('fixes obj=5, method=3 — wrap(items.get(data));', () => {
                const code = 'wrap(items.get(data));';
                const output = 'wrap( items.get(data) );';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });
        });

        // MIN_CALLEE_LEN_FOR_SUPPRESSION = 8
        // Standalone inner callee needs 8+ chars to anchor.
        describe('MIN_CALLEE_LEN_FOR_SUPPRESSION (8)', () => {

            // toString = 8 chars = boundary
            it('skips at 8 — a(toString(x));', () => {
                ruleTester.run(
                    RULE, rule, validOnly('a(toString(x));')
                );
            });

            // indexOf = 7 chars < boundary
            it('fixes at 7 — a(indexOf(x));', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('a(indexOf(x));', 'a( indexOf(x) );')
                ));
            });
        });

        // INNER_CALLEE_PROXIMITY = 2
        // Inner callee's close paren must be within 2 tokens
        // of the outer close to contribute to the pile-up.
        describe('INNER_CALLEE_PROXIMITY (2)', () => {

            // wrap(toString(x)); -> inner ) at 5, outer ) at 7
            // 7 - 5 = 2 = at boundary
            it('skips at proximity=2 — wrap(toString(x));', () => {
                ruleTester.run(
                    RULE, rule, validOnly('wrap(toString(x));')
                );
            });
        });

        // MIN_CONTENT_LEN_FOR_SUPPRESSION = 15
        // Total char width between outer brackets; at 15+
        // content provides enough visual separation.
        describe('MIN_CONTENT_LEN_FOR_SUPPRESSION (15)', () => {

            // {longValueStri} = 15 chars (13 + {}) = boundary
            it('skips at 15 — fn({longValueStri});', () => {
                ruleTester.run(
                    RULE, rule, validOnly('fn({longValueStri});')
                );
            });

            // {longValueStr} = 14 chars < boundary
            it('fixes at 14 — fn({longValueStr});', () => {
                ruleTester.run(RULE, rule, invalidOnly(
                    expectFix('fn({longValueStr});', 'fn( {longValueStr} );')
                ));
            });
        });

        // MIN_BRACKET_INNER_LEN = 10 (bracket access)
        // Inner identifier in obj[inner[prop]] needs 10+ chars.
        describe('MIN_BRACKET_INNER_LEN (10)', () => {

            // characters = 10 chars = boundary
            it('skips at 10 — obj[characters[longPropertyName]]', () => {
                const code = 'obj[characters[longPropertyName]]';
                ruleTester.run(RULE, rule, validOnly(code));
            });

            // charGroup = 9 chars < boundary
            it('fixes at 9 — obj[charGroup[longPropertyName]]', () => {
                const code = 'obj[charGroup[longPropertyName]]';
                const output =
                    'obj[ charGroup[longPropertyName] ]';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });
        });

        // MIN_BRACKET_OUTER_LEN = 10 (bracket access)
        // Outer identifier in outer[arr[prop]] needs 10+ chars.
        describe('MIN_BRACKET_OUTER_LEN (10)', () => {

            // characters = 10 chars = boundary
            it('skips at 10 — characters[arr[longPropertyName]]', () => {
                const code = 'characters[arr[longPropertyName]]';
                ruleTester.run(RULE, rule, validOnly(code));
            });

            // charGroup = 9 chars < boundary
            it('fixes at 9 — charGroup[arr[longPropertyName]]', () => {
                const code = 'charGroup[arr[longPropertyName]]';
                const output =
                    'charGroup[ arr[longPropertyName] ]';
                ruleTester.run(
                    RULE, rule, invalidOnly(expectFix(code, output))
                );
            });
        });
    });

    // -------------------------------------------------------
    // 4. Fix idempotency
    // -------------------------------------------------------

    describe('fix idempotency', () => {

        it('all fix outputs re-validate as valid', () => {
            const fixOutputs = [
                // P1: brackets that pile up
                'setState( [[initialRow]] )',
                'db.insert( [{name: val}] )',
                'app.use( cors(config(defaults())) )',
                'parseInt( getValue() )',
                // P2: semicolons and trailing punctuation
                'emit( parse() );',
                // P3: chained access
                'wrap( parse(data) ).unwrap()',
                "require( resolve('./module') )('./config')",
                'callback( obj.method() ).next()',
                'Object.keys( getConfig() ).forEach(fn)',
                // P8: bracket access
                'obj[ arr[longPropertyName] ]',
                // P9: template literals
                '`${ getName() }`',
                '`${ fn(bar()) }`',
                'html`${ fn(bar()) }`',
                // P10/P11: multi-line
                'foo(\n    bar() )',
                // P12: arrows
                'arr.map( x => ({key: x}) )',
                'arr.forEach( (x, i) => process(x) )',
                'race( x => fetch(x), y => cache(y) )',
                'arr.forEach( ({name}) => process(name) )',
                // P13: comma suppression
                'foo( data, bar(parse()) );',
                // Boundary fix outputs
                'fn( {longValueStr} );',
                'fn( sh(longArg) );',
                // Additional real-world
                'Array.from( new Set([...items]) )',
                "require( resolve('./path') );",
                'assert( equal(a, b) );',
                'const x = cond ? fn( bar() ) : baz',
                'if ( has(get(key)) ) {}',
                // Bracket boundary fixes
                'obj[ charGroup[longPropertyName] ]',
                'charGroup[ arr[longPropertyName] ]',
            ];
            ruleTester.run(RULE, rule, validOnly(...fixOutputs));
        });
    });
});
