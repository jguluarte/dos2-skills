import baseConfig from './eslint.config.mjs';
import diff from 'eslint-plugin-diff';

export default [
    ...baseConfig,
    ...diff.configs["flat/diff"],
];
