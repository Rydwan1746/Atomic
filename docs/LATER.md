# Later

Ideas agreed as worth doing, parked until after the first round of feedback.

## Installable and offline (PWA)

**What:** add a web app manifest (name, icons, theme colour) and a service worker that caches the app's files, so Atomic can be added to a phone's home screen and opens without a connection.

**Why:** Atomic is already local-first: all data lives in the browser and nothing needs a server. Being installable makes the daily check-in one tap away, and working offline matches how the app already behaves. On iPhone, installed web apps are also exempt from Safari clearing the data of sites that have not been visited for a while.

**Costs and trade-offs:**
- With a cached service worker, a new version reaches people one visit after it is published (the first visit downloads it, the next one uses it), unless an "Update available" prompt is added.
- One more file to keep in step with every release (the cache list and version).
- Icons need designing (at least 192px and 512px, plus an Apple touch icon).

**Rough plan:**
1. `manifest.webmanifest` and icons; link them from `index.html`.
2. `sw.js` that precaches `index.html`, `style.css` and `js/**`, serves them cache-first, and updates in the background.
3. A small "A new version is ready, reload" notice when the service worker updates.
4. Allow the service worker in the security policy (`worker-src 'self'`).
5. Test install and offline use on Android Chrome and iPhone Safari.

**Size:** medium (about a day including testing on real phones).
