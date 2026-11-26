# Deploying Atomic

Atomic is a folder of static files (HTML, CSS, JavaScript modules). There is no build step and no server code, so any static host can serve it. All data stays in each visitor's own browser; deploying a copy does not share anyone's data.

## Option A: GitHub Pages (recommended, free)

The repository is already on GitHub, so this takes about two minutes.

1. On GitHub, open the repository and go to **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Pick the branch **main** and the folder **/ (root)**, then press **Save**.
4. Wait a minute or two. The page shows the address, in the form `https://<your-username>.github.io/<repository-name>/`. Open it.

Every push to `main` redeploys automatically within a minute or two. If a change does not show up, reload the page with the cache bypassed (Ctrl+Shift+R, or Cmd+Shift+R on a Mac).

Notes:
- **The site is public.** Anyone with the address can open the app (they get their own empty copy; they cannot see your data). On GitHub's free plan, Pages needs a public repository, and the repository's files (including `docs/`, `tests/` and the planning documents) are public too. Folders starting with an underscore, such as `_bmad-output`, are not served as web pages, but they are still readable in the repository.
- **Custom domain (optional):** Settings > Pages > Custom domain, then add the DNS record GitHub shows. Tick **Enforce HTTPS**.

## Option B: Netlify or Cloudflare Pages

Both work with the same settings:
- **Build command:** none (leave empty).
- **Publish directory:** the repository root (`/` or `.`).

Connect the GitHub repository in their dashboard, or drag the folder onto Netlify's "Deploy manually" area for a one-off upload.

## After deploying: check these

1. Open the site and add a habit. Reload: it should still be there.
2. Open Journal and write a few lines: the ruled lines should appear.
3. Open the browser console (F12). There should be no red errors.
4. If you use Chat with a cloud provider, send one message to confirm the key works.

## Moving your data to the deployed site

Data belongs to the address the app is opened from, so `http://localhost:8000` and your deployed site each have their own data.

1. On the old address: **Me > Data & privacy > Download backup**.
2. On the new address: **Me > Data & privacy > Restore from backup**, and choose the file.

If passphrase protection is on, the JSON backup is not encrypted: store it somewhere safe or use **Export encrypted backup** (Me > Data & privacy) instead, then **Restore encrypted backup** on the new address.

## Using local Ollama with the deployed site

Ollama runs on your own computer at `http://localhost:11434`. A hosted site can still use it from that computer, with two extra steps.

**1. Allow the site's address in Ollama.** Ollama only accepts browser requests from addresses it is told to trust. Set `OLLAMA_ORIGINS` to your site's origin (scheme and host, no path), then restart Ollama:

- **macOS (Ollama app):** run the command below in Terminal, then quit and reopen Ollama.

  ```bash
  launchctl setenv OLLAMA_ORIGINS "https://<your-username>.github.io"
  ```

- **Linux (systemd service):** run `sudo systemctl edit ollama`, add the two lines below, save, then run `sudo systemctl restart ollama`.

  ```ini
  [Service]
  Environment="OLLAMA_ORIGINS=https://<your-username>.github.io"
  ```

- **Windows:** add a user environment variable `OLLAMA_ORIGINS` with the value `https://<your-username>.github.io` (Settings > System > About > Advanced system settings > Environment Variables), then quit and restart Ollama from the system tray.

**2. Let the browser reach localhost.** A secure (https) page talking to `http://localhost` is treated specially by browsers:
- Chrome, Edge and Firefox allow it. Recent versions of Chrome may show a prompt asking whether the site may access devices on your local network: choose **Allow**.
- Safari is stricter about secure pages calling `http://localhost`, and may block it. If Test connection fails in Safari but works in Chrome, this is why; use Chrome or Firefox for local AI, or run Atomic from `http://localhost:8000` on that computer.

Then open **Me > AI**, choose **Local Ollama**, and press **Test connection**.

Local Ollama only works on the computer where Ollama runs. On a phone, Chat falls back to offline reflections unless you choose a cloud provider.

## Running it locally instead

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Any static file server works; ES modules do not load from `file://`.
