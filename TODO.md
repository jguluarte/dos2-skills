# Future Development

## Environment Setup
- [x] Set up devbox + direnv for reproducible development environment
- [ ] Add linting tools (eslint, stylelint, yamllint)
- [x] Configure pre-commit hooks

## Refactoring: JavaScript Architecture
- [ ] Refactor `createSkillCard()` and related functions to use DOM construction instead of string concatenation
- [ ] Extract pure rendering functions (data in, DOM elements out)
- [ ] Improve separation of concerns (data, rendering, filtering, UI)
- [ ] Reduce function complexity and improve testability

## Testing
- [x] Add test runner and basic test infrastructure (Node.js built-in, zero deps)
- [x] Add unit tests for filter logic
- [x] Add data validation tests for skills.yaml
- [ ] Consider E2E tests for critical user flows

## CSS / Visual Verification
- [ ] Add CSS color verification tests (ensure tree colors don't drift during refactoring)
- [ ] Clean up coupling between JS rendering (data attributes) and CSS selectors — make the contract explicit
- [ ] Consider screenshot/snapshot tests for visual regression (e.g. Playwright or similar)
- [ ] Add more space between SP/AP icons