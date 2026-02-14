# Future Development

## Environment Setup
- [ ] Set up devbox + direnv for reproducible development environment
- [ ] Add linting tools (eslint, stylelint, yamllint)
- [ ] Configure pre-commit hooks

## Refactoring: JavaScript Architecture
- [ ] Refactor `createSkillCard()` and related functions to use DOM construction instead of string concatenation
- [ ] Extract pure rendering functions (data in, DOM elements out)
- [ ] Improve separation of concerns (data, rendering, filtering, UI)
- [ ] Reduce function complexity and improve testability

## Testing
- [ ] Add test runner and basic test infrastructure
- [ ] Add unit tests for filter logic
- [ ] Add integration tests for skill rendering
- [ ] Consider E2E tests for critical user flows
