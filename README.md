# Mansfield

Static site. No build step, no dependencies, no framework.

```
index.html    wordmark over the ring field
info.html     the three sentences
styles.css    palette, type, layout, ring brightness
rings.js      the ring field (vanilla WebGL)
geist-latin-var.woff2   Geist, latin subset, variable 300-600
favicon.svg
```

## Preview

```
python3 -m http.server 4173
```

Then open http://localhost:4173/

## Deploy

**msfd.vc is served by GitHub Pages**, from `main`, path `/` — the repo root is
the site. Every push to `main` publishes. Verified against the live headers
(`x-github-request-id`, Fastly `x-served-by`) and `gh api repos/:owner/:repo/pages`.

Cloudflare sits in front as the proxy only: the domain is registered at Hostinger
with DNS delegated to Cloudflare, orange-clouded at GitHub Pages. It is not
Cloudflare Pages, whatever this file used to claim.

Two consequences worth knowing:

- **`_headers` does nothing.** GitHub Pages ignores it. Static assets are served
  `max-age=14400` and HTML `max-age=600`, and that is not configurable. The file
  is kept for the day the site moves to a host that reads it.
- **`build-pages.sh` is not what publishes.** It collects the site into `_site/`
  for a Cloudflare Pages-style host. Nothing runs it today, but any new file must
  still be added to its `cp` line or a future move to that host drops it.

`info.html` is served at `/info.html`; the extensionless `/info` works because
GitHub Pages resolves it.

### After a deploy that adds a file

GitHub Pages caches 404s on its CDN for four hours, **per edge POP**. Request a
not-yet-published asset during a build and that POP serves the 404 for the rest
of the TTL while other POPs serve the file — the site then half-works depending
on where the visitor is. Do not poll for a new asset until the build reports
`built`:

```
gh api repos/claudio1616/mansfield-web/pages/builds/latest --jq .status
```

A stale negative cache clears on the next successful build, so pushing again is
the fix if it happens.

## The ring field

`rings.js` is a port of React Bits' MagicRings. The fragment shader is theirs,
unmodified; only the React + three.js host was replaced, so the site keeps no
dependencies. It degrades cleanly: no WebGL means no canvas and no error, and
`prefers-reduced-motion` draws a single still frame instead of animating.

Two knobs worth knowing:

- **Brightness** — `--ring-strength` in `styles.css` (currently `0.62`). This is
  the real one. The shader's own opacity uniform only scales alpha, which with
  premultiplied compositing over a near-black page does almost nothing.
- **Colour** — `--ring-a` and `--ring-b` in `styles.css`, read live by the
  script. Geometry and speed live in the `P` object at the top of `rings.js`.

The palette is fixed dark on purpose: the rings are a light-emission effect and
only read against a dark ground.
