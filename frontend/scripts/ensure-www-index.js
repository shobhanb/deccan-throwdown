#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const wwwDir = path.join(__dirname, '..', 'www');
const indexHtml = path.join(wwwDir, 'index.html');
const csrHtml = path.join(wwwDir, 'index.csr.html');

if (fs.existsSync(indexHtml)) {
  process.exit(0);
}

if (fs.existsSync(csrHtml)) {
  fs.copyFileSync(csrHtml, indexHtml);
  process.exit(0);
}

console.error(
  'Error: www/index.html not found after build (expected index.csr.html from Angular hybrid output).'
);
process.exit(1);
