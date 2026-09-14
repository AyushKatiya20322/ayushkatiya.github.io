# Ayush Katiya | Robotics & AI Portfolio

A GitHub Pages-ready personal portfolio focused on robotics, AI, computer vision, autonomous systems, RPA, and full-stack ML work.

## Highlights

- Responsive editorial/research-inspired interface
- Light and dark themes
- Searchable and filterable project gallery
- Live GitHub profile/repository statistics
- Interactive **Arena.io** canvas game with local high score
- Keyboard command palette and quick navigation
- Installable PWA with offline caching
- Accessible reduced-motion support, skip navigation, semantic sections, and mobile controls
- SEO/Open Graph metadata, sitemap, robots.txt, and custom 404 page

## Deploy to GitHub Pages

This repository already contains the GitHub Actions workflow needed for Pages.

1. Upload/push **all files and folders in this repository root** to your GitHub repository.
2. Make sure your default branch is named `main`.
3. In GitHub, open **Settings > Pages**.
4. Under **Build and deployment > Source**, choose **GitHub Actions**.
5. Push to `main`. The workflow in `.github/workflows/static.yml` deploys the site automatically.

For a user site, the repository should normally be named `AyushKatiya20322.github.io`.

## Local preview

Because the service worker and some browser APIs require HTTP, preview with a local server instead of opening `index.html` directly:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Structure

```text
.
├── .github/workflows/static.yml
├── assets/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── profile.jpg
│   └── profile1.jpg
├── 404.html
├── index.html
├── manifest.webmanifest
├── resume.pdf
├── robots.txt
├── sitemap.xml
└── sw.js
```

## Updating content

Most portfolio content and UI code currently lives in `index.html`, making the site easy to deploy without a build system. Replace `resume.pdf` whenever your resume changes. Profile assets live under `assets/`.

## Arena.io controls

Use **WASD** or **arrow keys** to move. Collect green energy cores, avoid tracking drones, survive as long as possible, and beat the locally stored high score. Touch controls are available on smaller screens.
