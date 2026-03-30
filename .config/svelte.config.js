const ignoreWarnings = [
    'a11y_click_events_have_key_events',
];

export default {
    onwarn(warning, handler) {
        if (ignoreWarnings.includes(warning.code)) return;
        handler(warning);
    },
};
