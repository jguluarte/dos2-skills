# DOS2 Skills Lookup - Development Guide

## Environment Setup

This project uses **devbox** for sandboxed tooling (no npm/node_modules!). All tools are managed via Nix packages.

### First-Time Setup

```bash
# devbox and direnv should be installed globally
# When you cd into the project, direnv automatically loads the devbox environment

cd dos2-skills
# You should see: "direnv: loading ~/dos2-skills/.envrc"
# If not, run: direnv allow
```

The `.envrc` file automatically activates the devbox shell, which provides:
- `sass` (Dart Sass standalone) for SCSS compilation

## Local Development Workflow

**IMPORTANT:** This project requires a local web server to work properly due to CORS restrictions with `fetch()`.

### Starting the Dev Server

Use the Makefile commands:

```bash
make start   # Start dev server (takes over terminal)
make kill    # Kill any hanging processes on port 8000
```

Then visit: `http://localhost:8000`

Press `Ctrl+C` to stop the server.

### CSS Development

Styles are written in **SCSS** (`css/styles.scss`) and compiled to CSS.

**Watch mode (auto-compile on save):**
```bash
make watch   # Watches css/styles.scss and auto-compiles on changes
```

**Manual compilation:**
```bash
make build   # Compiles SCSS → CSS + updates cache-busting hash
```

The build process:
1. Compiles `css/styles.scss` → `css/styles.css` (compressed, no source maps)
2. Calculates SHA256 hash of compiled CSS
3. Updates `index.html` with versioned CSS URL (e.g., `styles.css?v=3fe493c0`)

## Data Editing

- Edit `data/skills.yaml` directly
- Refresh browser to see changes
- No build step required for data changes

## Deployment

### Automatic Deployment (Recommended)

A **git pre-push hook** automatically builds CSS when pushing to `main`:

```bash
git push origin main
# Hook runs automatically:
# 1. Compiles SCSS → CSS
# 2. Updates cache-busting hash
# 3. If index.html changed, push is blocked with instructions to commit it
```

If the build modifies `index.html`, you'll see:
```
⚠️  Build modified index.html (CSS hash updated)
   Please review and commit the changes before pushing again.
```

Then just commit and push again:
```bash
git add index.html
git commit -m "Update CSS cache-busting hash"
git push
```

### Manual Deployment

```bash
make deploy   # Builds + commits + pushes to main
```

This will:
1. Compile SCSS → CSS
2. Update CSS cache-busting hash in `index.html`
3. Commit the updated `index.html`
4. Push to `main` branch
5. GitHub Pages auto-deploys

**Live site:** https://jguluarte.github.io/dos2-skills

### Cache Busting

The build script adds a hash to the CSS file URL (e.g., `styles.css?v=3fe493c0`). The hash is based on the compiled CSS file's SHA256, so it only changes when the CSS content actually changes. This prevents browser caching issues on mobile Safari.

## Agent Workflow Notes

- **User prefers to review diffs manually in shell** - don't show long diffs unless asked
- VSCode plugin doesn't allow agents to act without inputs (requires manual approval)
- Current workaround: Using Claude.ai web interface for more autonomous workflow
- Branch context may not update correctly in conversation UI
