.PHONY: start kill

start:
	@echo "Starting dev server on http://localhost:8000"
	python3 -m http.server 8000

kill:
	@echo "Killing processes on port 8000..."
	@lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "Port 8000 freed" || echo "No processes found on port 8000"
