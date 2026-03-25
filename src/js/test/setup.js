// Vitest setup — mirrors the browser environment where Handlebars
// is loaded as a global via CDN <script> tag. Runs before all tests.
import Handlebars from 'handlebars';
import { registerHelpers } from '@js/handlebars-helpers.js';

globalThis.Handlebars = Handlebars;
registerHelpers(Handlebars);
