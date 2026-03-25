import { defineConfig } from 'vite';
import { cpSync } from 'fs';
import { aliases } from './vite.aliases.js';

export default defineConfig({
    root: 'src',
    resolve: { alias: aliases },
    build: {
        outDir: aliases['@dist'],
        emptyOutDir: true,
    },
    plugins: [{
        name: 'copy-runtime-assets',
        closeBundle() {
            const exclude = (src) => !src.includes('/test');
            const dest = `${aliases['@dist']}/data`;
            cpSync(aliases['@data'], dest, {
                recursive: true, filter: exclude,
            });
        },
    }],
});
