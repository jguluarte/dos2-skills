.PHONY: start kill build watch deploy

start:
	@echo "Starting SCSS watch and dev server..."
	@trap 'kill 0' EXIT; \
	eval "$$(devbox shellenv)" && \
	sass css/styles.scss:css/styles.css --watch --style=expanded & \
	python3 -m http.server 8000

kill:
	lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "Port 8000 freed" || echo "No processes found on port 8000"

# Compile SCSS to CSS and update cache-busting hash
build:
	./build.sh

# Watch SCSS for changes and auto-compile (for development)
watch:
	@echo "Watching css/styles.scss for changes..."
	@eval "$$(devbox shellenv)" && sass css/styles.scss:css/styles.css --watch --style=expanded

# Deploy to GitHub Pages (pre-push hook auto-builds on main)
deploy: build
	git add index.html
	git commit -m "Update CSS cache-busting hash" || true
	git push origin main
