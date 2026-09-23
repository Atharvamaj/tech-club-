# IRHS Tech Club Dual-Screen Social Wall

A static GitHub Pages site that turns two laptop browsers into one synchronized 3840×1080 display.

## What it shows

- Instagram QR: `@irhs_tech.club`
- Discord QR: paste the current invite into the LEFT-screen control panel
- Tech Club website QR
- Google Classroom is intentionally **not displayed**
- Moving text runs continuously across the full two-laptop canvas

## Use it

1. Open the GitHub Pages URL on laptop 1 and choose **Create LEFT screen**.
2. Open the same URL on laptop 2 and choose **Join as RIGHT screen**.
3. Enter the six-character room code.
4. On the left laptop, paste the current Discord invite if needed.
5. Press fullscreen on both laptops.
6. Put the laptops side-by-side and use X/Y nudge to align the seam.
7. Press `H` to hide/show controls and `F` for fullscreen.

## Publish on GitHub Pages

1. Create a GitHub repository and upload all files in this folder.
2. Make sure the default branch is `main`.
3. In **Settings → Pages**, set **Source** to **GitHub Actions**.
4. Push to `main`. The included `.github/workflows/pages.yml` deploys the site automatically.

There is no build step and no Vercel configuration.

## Editing the default links

Open `app.js` and edit the `state` object near the top. The Instagram and website links are already filled in. You can also paste the Discord URL live from the left-screen control panel without changing the code.
