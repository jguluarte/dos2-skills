.PHONY: npm build start kill test test-verbose typecheck \
		lint lint-yaml lint-css lint-js

npm: .make-timestamp.npm
.make-timestamp.npm: package.json package-lock.json
	npm install --silent
	@touch $@

build: npm
	npx vite build
	cp -r data docs/data

start: npm
	npx vite

kill:
	lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "Port 5173 freed" || \
		echo "No processes found on port 5173"

typecheck:
	npx tsc --noEmit

# If linters or test runners change...make any corresponding change needed to
# .github/workflows/ci.yml
test:
	npx vitest run

lint: lint-yaml lint-css lint-js

lint-yaml:
	yamllint -c .config/yamllint.yml data/

lint-css:
	npx stylelint --config .config/stylelintrc.json css/styles.scss

lint-js:
	npx eslint --config .config/eslint.config.mjs js/ test/
