.PHONY: build start kill watch test test-verbose lint lint-yaml lint-css lint-js

build: index.html css/styles.css

index.html: src/index.html css/styles.css
	@echo "rebuilding $@..."
	sed 's/__CSS_HASH__/$(shell shasum -a 256 css/styles.css | cut -c1-8)/g' $< > $@

css/styles.css: css/styles.scss
	sass $< $@ --style=compressed --no-source-map

start:
	@echo "Starting SCSS watch and dev server..."
	@trap 'kill 0' EXIT; \
	sass css/styles.scss:css/styles.css --watch --style=expanded & \
	python3 -m http.server 8000

kill:
	lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "Port 8000 freed" || \
		echo "No processes found on port 8000"

watch:
	@echo "Watching css/styles.scss for changes..."
	sass css/styles.scss:css/styles.css --watch --style=expanded

# If linters or test runners change...make any corresponding change needed to
# .github/workflows/ci.yml
test:
	node --test --test-reporter=dot test/*.test.js

test-verbose:
	node --test test/*.test.js

lint: lint-yaml lint-css lint-js

lint-yaml:
	yamllint -c .config/yamllint.yml data/

lint-css:
	npx stylelint --config .config/stylelintrc.json css/styles.scss

lint-js:
	npx eslint --config .config/eslint.config.mjs js/ test/
