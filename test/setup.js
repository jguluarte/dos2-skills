import Handlebars from 'handlebars';
import { registerHelpers } from '../js/handlebars-helpers.ts';

globalThis.Handlebars = Handlebars;
registerHelpers(Handlebars);
