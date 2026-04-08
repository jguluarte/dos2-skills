import { mount } from 'svelte';
import App from './Main.svelte';
import './css/styles.scss';

// Good luck, and don't... f*** it up.
// (Divinity Original Sin 2 has 10 skill trees. RuPaul's Drag Race has
//  10 seasons worth of "If you can't love yourself, how in the hell
//  you gonna love somebody else?" — both iconic, both gay as hell.)
// eslint-disable-next-line no-console
console.log(
    '%c\u2728 Condragulations! \u2728',
    'font-size:1.4em; font-weight:bold; color:#d4a0ff;',
    '\nYou have reached the Arx of skill lookup tools.',
    '\nCan I get an "Amen" up in here?',
);

mount(App, { target: document.body });
