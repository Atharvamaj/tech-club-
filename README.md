# IRHS Tech Club — Two-Laptop Digital Poster Board

A static GitHub Pages poster wall designed to span two 16:9 laptop screens.

## What this version is

This is **not a dashboard**. It is a club showcase / digital poster board:

- One 3840×1080 poster split across two laptops
- Laptop 1 shows the left half; Laptop 2 shows the right half
- A moving ticker travels continuously through both screens
- Instagram QR and Discord QR, with a welcoming introduction for new members
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

Meeting information fits above the bottom ticker on both displays. If the Discord invite is not configured, the poster asks visitors to speak with the team.

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

## Poster content and awake mode

Meetings: Tuesdays at lunch, Room 131. Activities: 3D printing, ESP32 projects, and computer teardowns.

The poster requests a screen wake lock automatically on supported browsers over HTTPS. The button shows SCREEN STAYS AWAKE when active and lets you turn it off. It reacquires the lock when you return to the poster tab, and releases it when you exit the poster. Keep the tab visible; system power settings or low battery can reject the request. If unavailable, temporarily set display sleep to Never in your computer settings.
