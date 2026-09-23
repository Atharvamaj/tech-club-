# IRHS Tech Club — Two-Laptop Digital Poster Board

A static GitHub Pages poster wall designed to span two 16:9 laptop screens.

## What this version is

This is **not a dashboard**. It is a club showcase / digital poster board:

- One 3840×1080 poster split across two laptops
- Laptop 1 shows the left half; Laptop 2 shows the right half
- A moving ticker travels continuously through both screens
- Instagram QR, Discord QR, and website QR
- Google Classroom is intentionally not shown
- Tech Club meeting information and club focus are part of the poster
- No server, database, Node build, or Vercel required

## Add the Discord invite

Open `config.js` and paste the real Tech Club invite:

```js
discordUrl: "https://discord.gg/YOUR_INVITE_HERE",
```

Do not use another club's Discord link.

## Run it

Open the same site on both laptops.

- On laptop 1 choose **LEFT HALF**
- On laptop 2 choose **RIGHT HALF**
- Put the screens beside each other
- Enter fullscreen

Direct URLs also work:

- `https://YOURNAME.github.io/YOUR-REPO/?screen=left`
- `https://YOURNAME.github.io/YOUR-REPO/?screen=right`

The moving text is driven by the current clock, so both laptops stay visually aligned without a room code or backend.

## Alignment

Press **C** on either laptop to open hidden alignment controls. Adjust X/Y and Scale until the centre seam looks continuous. Each laptop saves its own calibration in local storage.

Press **F** to toggle fullscreen.

## GitHub Pages

1. Create a public GitHub repository.
2. Upload all files from this folder to the repository root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose `main` and `/ (root)`.
6. Save.

GitHub will publish the poster at `https://YOURNAME.github.io/YOUR-REPO/`.

## Files

- `index.html` — poster structure
- `styles.css` — dual-screen poster design
- `app.js` — screen slicing, fullscreen, synchronized ticker, calibration
- `config.js` — links and moving text
- `.nojekyll` — GitHub Pages helper
