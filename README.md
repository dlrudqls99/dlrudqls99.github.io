# Kyungbin's Notes

Personal knowledge base at [dlrudqls99.github.io](https://dlrudqls99.github.io). Jekyll on GitHub Pages, no theme gem.

## Layout

- `_posts/` — notes. First category = folder in the left tree. Tags cross-link notes ("Linked notes" at the bottom of each note).
- `_layouts/default.html` — three-pane shell (tree / note / outline) + Ctrl K search palette.
- `_includes/sidebar.html` — note tree, built from `site.posts` grouped by first category.
- `assets/js/kb.js` — theme toggle, mobile nav, outline, copy buttons, search.
- `search.json` — search index, fetched on first search.
- `_sass/custom/custom.scss` — Dracula (dark, default) and GitHub (light) tokens.

## Run locally

```bash
bundle install
bundle exec jekyll serve --livereload
```
