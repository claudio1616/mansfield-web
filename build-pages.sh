#!/bin/sh
# Collect the site into _site/ for Cloudflare Pages. Nothing else ships.
set -eu
rm -rf _site
mkdir -p _site
cp index.html info.html styles.css rings.js geist-latin-var.woff2 favicon.svg robots.txt _headers _site/
