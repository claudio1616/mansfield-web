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

Drag the folder into Vercel, Netlify, or Cloudflare Pages — no configuration.
`info.html` is served at `/info` on all three.

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

## Before going live

`grep -rn PLACEHOLDER .` finds the three spots that need real values:

- contact address in `info.html` (currently `hello@mansfield.vc`)
- canonical domain in `index.html` and `info.html`

To stay out of search results, uncomment the `robots` meta tag near the top of
both HTML files.
