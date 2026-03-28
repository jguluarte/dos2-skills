import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { cpSync } from 'fs';
import { aliases } from './vite.aliases.js';

export default defineConfig({
    root: 'src',
    base: process.env.NODE_ENV === 'production' ? '/dos2-skills/' : '/',
    server: { allowedHosts: true },
    resolve: { alias: aliases },
    build: {
        outDir: aliases['@dist'],
        emptyOutDir: true,
    },
    plugins: [
        svelte({ configFile: '../.config/svelte.config.js' }),
        {
            name: 'copy-runtime-assets',
            closeBundle() {
                const exclude = (src) => !src.includes('/test');
                const dest = `${aliases['@dist']}/data`;
                cpSync(aliases['@data'], dest, {
                    recursive: true, filter: exclude,
                });
            },
        },
    ],
});
