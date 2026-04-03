import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)), '..'
);

export const svelteConfig = path.resolve(root, '.config/svelte.config.js');

export const aliases = {
    '@': path.resolve(root, 'src'),
    '@js': path.resolve(root, 'src/js'),
    '@components': path.resolve(root, 'src/components'),
    '@data': path.resolve(root, 'src/data'),
    '@dist': path.resolve(root, 'dist'),
    '@templates': path.resolve(root, 'src/templates'),
    '@constants': path.resolve(root, 'src/js/constants.js'),
};
