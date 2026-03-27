// Vitest setup — runs before all tests.
import Handlebars from 'handlebars';
import { registerHelpers } from '@js/handlebars-helpers.js';
import { setFaker } from 'zod-schema-faker/v4';
import { faker } from '@faker-js/faker';

globalThis.Handlebars = Handlebars;
registerHelpers(Handlebars);
setFaker(faker);
