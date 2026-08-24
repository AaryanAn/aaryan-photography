# Photography Portfolio

Self-hosted photography site at [portfolio.aaryan.store](https://portfolio.aaryan.store). No CMS, no database, no build step — static HTML/CSS/JS served directly by Caddy.

## How it works

There's no image manifest checked into this repo. `main.js` fetches Caddy's `file_server` browse API (`Accept: application/json`) for each section (`travel`, `portraits`, `everyday`) on every page load, so dropping a new photo symlink into place on the server makes it appear on next load — no rebuild needed.

Photos live outside this repo entirely, as symlinks into an Immich library on the server, with per-section `metadata.json` files for city/country captions. Nothing photo-related is ever part of this codebase.

## Files

- `index.html` — structure: header, filter bar, three sections (Travel/Portraits/Everyday), lightbox markup
- `style.css` — design: warm off-white background, Cormorant Garamond + Inter, terracotta accent
- `main.js` — fetches photo listings + metadata, renders galleries, lightbox, custom cursor, scroll-reveal, filter bar
- `favicon.svg` — italic "AA" monogram
