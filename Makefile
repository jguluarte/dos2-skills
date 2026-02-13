.PHONY: start kill build deploy

start:
	python3 -m http.server 8000

kill:
	lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "Port 8000 freed" || echo "No processes found on port 8000"

build:
	./build.sh

deploy: build
	git add index.html
	git commit -m "Update CSS cache-busting hash" || true
	git push origin main
