import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";

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
            "eqeqeq": ["error", "always", { null: "ignore" }],
            "no-var": "error",
            "prefer-const": "error",
            "no-console": ["warn", {
                allow: ["error", "warn"],
            }],
            "one-var": ["error", "never"],
            "no-nested-ternary": "error",
            "@stylistic/indent": ["error", 4, {
                SwitchCase: 1,
                MemberExpression: 1,
                FunctionDeclaration: { parameters: 2, body: 1 },
                FunctionExpression: { parameters: 2, body: 1 },
                offsetTernaryExpressions: true,
            }],
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
    },
];
