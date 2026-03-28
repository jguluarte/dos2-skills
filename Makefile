##########################################################
# Actual build related
.PHONY: build clean

build:
	npx vite build --config .config/vite.config.js

clean:
	-rm -rf dist/ .make-timestamp*

##########################################################
# Local dev helpers
.PHONY: npm start kill test

npm: .make-timestamp.npm
.make-timestamp.npm: package.json package-lock.json
	npm install --silent
	@touch $@

start:
	npx vite --config .config/vite.config.js --port 8000 --host

kill:
	lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "Port 8000 freed" || \
		echo "No processes found on port 8000"

test:
	npx vitest run --config .config/vitest.config.js

##########################################################
# Lint helpers
#
# If these change, also update `.github/workflows/ci.yml
.PHONY: lint lint-yaml lint-css lint-js lint-fix lint-fix-all

MAX_LINT_WARNINGS ?= -1

STYLELINT := npx stylelint --config .config/stylelintrc.json
ESLINT := npx eslint --config .config/eslint.config.mjs
ESLINT_DIFF := npx eslint --config .config/eslint-diff.config.mjs

lint: lint-yaml lint-css lint-js

lint-yaml:
	yamllint -c .config/yamllint.yml src/data/

lint-css:
	$(STYLELINT) --max-warnings=$(MAX_LINT_WARNINGS) src/css/

lint-js:
	$(ESLINT) --max-warnings=$(MAX_LINT_WARNINGS) src/ .config/

lint-fix:
	ESLINT_PLUGIN_DIFF_COMMIT=$$(git merge-base HEAD @{upstream}) \
		$(ESLINT_DIFF) --fix src/ .config/

lint-fix-all:
	$(ESLINT) --fix src/ .config/
