import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";

const FOUR_SPACES = 4;

export default [
    {
        ignores: [
            "node_modules/",
            ".devbox/",
            ".venv/",
        ],
    },
    js.configs.recommended,
    {
        plugins: {
            "@stylistic": stylistic,
        },
        rules: {
            // === Baseline rules ===
            "eqeqeq": ["error", "always", { null: "ignore" }],
            "no-var": "error",
            "prefer-const": "error",
            "no-console": ["warn", {
                allow: ["error", "warn"],
            }],
            "one-var": ["error", "never"],
            "no-nested-ternary": "error",

            // === Error Prevention ===
            "array-callback-return": ["error", {
                allowImplicit: false,
                checkForEach: true,
            }],
            "consistent-return": "error",
            "no-constructor-return": "error",
            "no-duplicate-imports": "error",
            "no-promise-executor-return": ["error", {
                allowVoid: true,
            }],
            "no-self-compare": "error",
            "no-template-curly-in-string": "error",
            "no-unmodified-loop-condition": "error",
            "no-unreachable-loop": "error",
            "require-atomic-updates": "error",
            "no-use-before-define": ["error", {
                functions: false,
            }],

            // === Code Quality ===
            "curly": ["error", "multi-line"],
            "default-param-last": "error",
            "dot-notation": "error",
            "logical-assignment-operators": "error",
            "max-depth": ["error", 4],
            "max-nested-callbacks": ["error", 3],
            "no-else-return": "error",
            "no-param-reassign": "error",
            "no-shadow": "error",
            "no-throw-literal": "error",
            "no-unused-expressions": "error",
            "no-return-assign": ["error", "always"],
            "radix": "error",
            "require-await": "error",
            "no-sequences": "error",
            "default-case": "error",

            // === Modern JS (ES6+) ===
            "prefer-object-has-own": "error",

            "object-shorthand": "error",
            "prefer-arrow-callback": "error",
            "prefer-rest-params": "error",
            "prefer-spread": "error",
            "prefer-object-spread": "error",
            "prefer-numeric-literals": "error",
            "prefer-promise-reject-errors": "error",
            "prefer-regex-literals": ["error", {
                disallowRedundantWrapping: true,
            }],

            // === Cleanup (remove useless code) ===
            "no-useless-return": "error",
            "no-unneeded-ternary": "error",
            "no-useless-concat": "error",
            "no-useless-rename": "error",
            "no-useless-computed-key": "error",
            "no-useless-constructor": "error",
            "no-extra-bind": "error",
            "no-extra-label": "error",
            "no-useless-call": "error",

            // === Style Consistency ===
            "yoda": "error",
            "no-lonely-if": "error",
            "operator-assignment": ["error", "always"],
            "no-multi-assign": ["error", {
                ignoreNonDeclaration: true,
            }],
            "default-case-last": "error",
            "symbol-description": "error",

            // === Security ===
            "no-alert": "error",
            "no-eval": "error",
            "no-implicit-coercion": ["error", {
                allow: ["!!"],
            }],
            "no-implied-eval": "error",
            "no-extend-native": "error",
            "no-label-var": "error",
            "no-new": "error",
            "no-new-func": "error",
            "no-new-wrappers": "error",
            "no-octal-escape": "error",
            "no-proto": "error",
            "no-caller": "error",
            "no-iterator": "error",
            "no-script-url": "error",
            "no-multi-str": "error",
            "no-object-constructor": "error",
            "no-array-constructor": "error",

            // === Accessors ===
            "grouped-accessor-pairs": "error",
            "accessor-pairs": "error",

            // === Warn-only (not dev blockers; caught by CI and pre-merge) ===
            "no-warning-comments": "warn",
            "no-unreachable": "warn",
            "no-constant-condition": "warn",

            // === Stylistic (@stylistic) ===
            "@stylistic/indent": ["error", FOUR_SPACES, {
                SwitchCase: 1,
                MemberExpression: 1,
                FunctionDeclaration: { parameters: 2, body: 1 },
                FunctionExpression: { parameters: 2, body: 1 },
                offsetTernaryExpressions: true,
            }],
            "@stylistic/indent-binary-ops": ["error", FOUR_SPACES],
            "@stylistic/semi": ["error", "always"],
            "@stylistic/comma-dangle": ["error", {
                arrays: "always-multiline",
                objects: "always-multiline",
                imports: "always-multiline",
                exports: "always-multiline",
                functions: "only-multiline",
            }],
            "@stylistic/comma-spacing": "error",
            "@stylistic/object-curly-spacing": ["error", "always"],
            "@stylistic/keyword-spacing": "error",
            "@stylistic/space-before-blocks": "error",
            "@stylistic/space-infix-ops": "error",
            "@stylistic/key-spacing": ["error", {
                beforeColon: false,
                afterColon: true,
                mode: "minimum",
            }],
            "@stylistic/max-len": ["error", {
                code: 80,
            }],
            "@stylistic/arrow-parens": ["error", "always"],
            "@stylistic/arrow-spacing": "error",
            "@stylistic/brace-style": ["error", "1tbs", {
                allowSingleLine: true,
            }],
            "@stylistic/no-multiple-empty-lines": ["error", {
                max: 1,
            }],
            "@stylistic/block-spacing": "error",
            "@stylistic/computed-property-spacing": ["error", "never"],
            "@stylistic/function-call-spacing": ["error", "never"],
            "@stylistic/no-trailing-spaces": "error",
            "@stylistic/no-whitespace-before-property": "error",
            "@stylistic/rest-spread-spacing": ["error", "never"],
            "@stylistic/semi-spacing": ["error", {
                before: false,
                after: true,
            }],
            "@stylistic/space-before-function-paren": ["error", {
                anonymous: "always",
                named: "never",
                asyncArrow: "always",
            }],
            "@stylistic/space-unary-ops": ["error", {
                words: true,
                nonwords: false,
            }],
            "@stylistic/spaced-comment": ["error", "always", {
                exceptions: ["-", "*"],
            }],
            "@stylistic/switch-colon-spacing": ["error", {
                before: false,
                after: true,
            }],
            "@stylistic/no-multi-spaces": ["error", {
                exceptions: {
                    "Property": true,
                    "VariableDeclarator": true,
                },
            }],
            "@stylistic/no-tabs": "error",
            "@stylistic/no-extra-semi": "error",
            "@stylistic/no-floating-decimal": "error",
            "@stylistic/function-call-argument-newline": [
                "error", "never",
            ],
            "@stylistic/comma-style": ["error", "last"],
            "@stylistic/dot-location": ["error", "property"],
            "@stylistic/eol-last": ["error", "always"],
            "@stylistic/new-parens": ["error", "always"],
            "@stylistic/nonblock-statement-body-position": [
                "error", "beside",
            ],
            "@stylistic/no-confusing-arrow": ["error", {
                allowParens: true,
            }],
            "@stylistic/no-mixed-operators": ["error", {
                allowSamePrecedence: true,
            }],
            "@stylistic/semi-style": ["error", "last"],
            "@stylistic/yield-star-spacing": ["error", "before"],
            "@stylistic/generator-star-spacing": ["error", "after"],
        },
    },
    {
        files: ["js/**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                jsyaml: "readonly",
            },
        },
    },
    {
        files: ["test/**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node,
            },
        },
        rules: {
            "max-nested-callbacks": ["error", 5],
        },
    },
];
