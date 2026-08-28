# Mansfield

Static site. No build step, no dependencies, no framework.

```
index.html    wordmark over the ring field
info.html     the three sentences
styles.css    palette, layout, ring brightness
rings.js      the ring field (vanilla WebGL)
favicon.svg
```

## Preview

```
python3 -m http.server 4173
```

Then open http://localhost:4173/

## Deploy

Cloudflare Pages, connected to this repo. Every push to `main` publishes;
branches get preview URLs.

```
build command      sh build-pages.sh
output directory   _site
framework preset   none
```

`build-pages.sh` copies the six site files plus `_headers` into `_site/` — that
is the whole build. `info.html` is served at `/info`, and `/info.html`
308-redirects there.

Live at **msfd.vc**, registered at Hostinger with DNS delegated to Cloudflare.

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
