# Future Development

## Testing
- [ ] Add unit tests for filter logic
- [ ] Add integration tests for skill rendering
- [ ] Add test runner (Jest, Vitest, or native browser tests)
- [ ] Consider E2E tests for critical user flows

## Refactoring: JavaScript Architecture
- [ ] Replace string-based HTML generation with DOM object construction
- [ ] Break up monolithic app.js into focused modules
  - Separate concerns: data, rendering, filtering, UI interactions
- [ ] Create proper abstraction layers for skill card components
  - `createSkillName()`, `createSkillCost()`, etc. should return DOM elements
  - Parent functions compose DOM objects, not strings
- [ ] Consider class-based architecture for skill rendering
- [ ] Reduce function complexity and improve testability

## Linting/Formatting
- [ ] Add CSS/YAML linter (yamllint, stylelint)
- [ ] Add line length checks (80 chars max)
- [ ] Consider adding pre-commit hooks
