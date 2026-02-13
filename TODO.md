# Future Development

## Testing
- [ ] Add unit tests for filter logic
- [ ] Add integration tests for skill rendering
- [ ] Add test runner (Jest, Vitest, or native browser tests)
- [ ] Consider E2E tests for critical user flows

## Refactoring: Custom Elements
- [ ] Define semantic custom element structure
  - `<skill-tree type="pyrokinetic">`
  - `<tree-header>`, `<skill-card>`, `<skill-requirements>`, etc.
- [ ] Refactor rendering to use custom elements instead of divs
- [ ] Move all styling from JS to CSS using element + attribute selectors
- [ ] Remove `loadTreeColors()` and inline style manipulation
- [ ] Update YAML data if needed for semantic consistency

## Linting/Formatting
- [ ] Add CSS/YAML linter (yamllint, stylelint)
- [ ] Add line length checks (80 chars max)
- [ ] Consider adding pre-commit hooks
