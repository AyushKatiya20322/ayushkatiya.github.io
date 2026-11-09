# Ayush Katiya | Robotics & AI Portfolio

A responsive, installable portfolio for robotics, computer vision, autonomous systems, and applied AI. It is deployed as a static GitHub Pages site, so the portfolio and game do not need a server-side runtime or third-party game library.

## Highlights

- Responsive portfolio with light and dark themes
- Searchable, filterable project gallery with quick previews
- Live GitHub profile and repository snapshot
- Arena.io canvas game with keyboard, mouse, touch, and mobile-pad controls
- Adjustable game speed and threat level, with a device-local personal best
- Keyboard command palette, reduced-motion support, and installable offline shell
- Open Graph metadata, sitemap, robots file, and custom 404 page

## Local preview

Run a local web server from this folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`. An HTTP server is needed for the service worker and installable app features.

## Deploy to GitHub Pages

The repository includes `.github/workflows/static.yml`, which deploys the root folder to GitHub Pages on pushes to `main`.

1. Push the contents of this folder to the repository's `main` branch.
2. In **Settings > Pages**, choose **GitHub Actions** as the deployment source.
3. Check the Actions tab for the Pages deployment.

## Updating content

Portfolio content and styling live in `index.html`; Arena.io lives in `arena.js`. Replace `resume.pdf` when the resume changes; profile images and PWA icons live under `assets/`. Update the service worker cache name in `sw.js` when changing cached files.

## Arena.io controls

Use **WASD**, **arrow keys**, the on-screen directional pad, or hold and drag on the canvas with a mouse or touch. Adjust threat level and movement speed in the game panel. The personal best is stored only in the current browser.
