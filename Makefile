.PHONY: start kill build watch deploy test test-verbose lint lint-yaml lint-css lint-js

start:
	@echo "Starting SCSS watch and dev server..."
	@trap 'kill 0' EXIT; \
	sass css/styles.scss:css/styles.css --watch --style=expanded & \
	python3 -m http.server 8000

kill:
	lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "Port 8000 freed" || \
		echo "No processes found on port 8000"

# Compile SCSS to CSS and update cache-busting hash
build:
	./build.sh

# Watch SCSS for changes and auto-compile (for development)
watch:
	@echo "Watching css/styles.scss for changes..."
	sass css/styles.scss:css/styles.css --watch --style=expanded

# Run tests (uses Node.js built-in test runner, no npm needed)
test:
	node --test --test-reporter=dot test/*.test.js

test-verbose:
	node --test test/*.test.js

# Linting
lint: lint-yaml lint-css lint-js

lint-yaml:
	yamllint data/

lint-css:
	npx stylelint --config .config/stylelintrc.json css/styles.scss

lint-js:
	npx eslint --config .config/eslint.config.mjs js/ test/

# Deploy to GitHub Pages (pre-push hook auto-builds on main)
deploy: build
	git add index.html
	git commit -m "Update CSS cache-busting hash" || true
	git push origin main
