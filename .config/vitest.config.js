import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { aliases } from './vite.aliases.js';

export default defineConfig({
    plugins: [svelte({ hot: false, configFile: '.config/svelte.config.js' })],
    resolve: {
        alias: aliases,
        conditions: ['browser'],
    },
    test: {
        environment: 'happy-dom',
        include: ['src/**/test/*.test.js'],
        setupFiles: ['src/js/test/setup.js'],
    },
});
