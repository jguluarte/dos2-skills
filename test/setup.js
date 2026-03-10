import Handlebars from 'handlebars';
import { registerHelpers } from '../js/handlebars-helpers.js';

globalThis.Handlebars = Handlebars;
registerHelpers(Handlebars);
