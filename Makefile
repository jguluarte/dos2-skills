##########################################################
# Actual build related
.PHONY: build clean

RELEASE := index.html css/styles.css $(wildcard js/*.js js/templates/* data/*)
DIST := $(addprefix dist/,$(RELEASE))

build: $(DIST)

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
	@echo "Starting SCSS watch and dev server..."
	@trap 'kill 0' EXIT; \
		sass css/styles.scss:css/styles.css --watch --style=expanded & \
		python3 -m http.server 8000

kill:
	lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "Port 8000 freed" || \
		echo "No processes found on port 8000"

test:
	npx vitest run

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
	yamllint -c .config/yamllint.yml data/

lint-css:
	$(STYLELINT) --max-warnings=$(MAX_LINT_WARNINGS) css/styles.scss

lint-js:
	$(ESLINT) --max-warnings=$(MAX_LINT_WARNINGS) js/ test/

lint-fix:
	$(ESLINT_DIFF) --fix js/ test/

lint-fix-all:
	$(ESLINT) --fix js/ test/


##########################################################
# Also build related
#
# This file uses `.SECONDEXPANSION` so we can use `$(@D)` to help determine what
# folders need to be created for CD. As such, we use a special wildcard to
# capture those as well. This allows us to see when these folders are created.
%/.:
	mkdir -p $@

# Everything after this point is evaluated twice, that way we can use
# as a prerequisite :)
.SECONDEXPANSION:

dist/index.html: src/index.html css/styles.scss | $$(@D)/.
	@echo "rebuilding $@..."
	sed 's/__HASH__/$(shell shasum -a 256 css/styles.scss | cut -c1-8)/g' $< > $@

dist/css/styles.css: css/styles.scss | $$(@D)/.
	sass $< $@ --style=compressed --no-source-map

$(filter-out %/index.html %/styles.css,$(DIST)): dist/%: % | $$(@D)/.
	cp $< $@
