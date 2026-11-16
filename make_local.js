// Save as: Project102/sumiro/make_local.js
// Run in Code App terminal: node make_local.js
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const bundleDir = path.join(rootDir, 'bundle');

function patchContent(content, isBundleFile) {
  let updated = content;

  // 1. Strip any full GitHub Pages URLs pointing to /sumiro/
  updated = updated.replace(/https?:\/\/[^"'\s]+\.github\.io\/sumiro\//g, isBundleFile ? '../' : './');

  // 2. Replace root-relative "/sumiro/bundle/" and "/sumiro/assets/"
  if (isBundleFile) {
    updated = updated.replace(/["']\/sumiro\/bundle\//g, (m) => m[0] + './');
    updated = updated.replace(/["']\/sumiro\/assets\//g, (m) => m[0] + '../assets/');
    updated = updated.replace(/["']\/bundle\//g, (m) => m[0] + './');
    updated = updated.replace(/["']\/assets\//g, (m) => m[0] + '../assets/');
  } else {
    updated = updated.replace(/["']\/sumiro\//g, (m) => m[0] + './');
    updated = updated.replace(/["']\/bundle\//g, (m) => m[0] + './bundle/');
    updated = updated.replace(/["']\/assets\//g, (m) => m[0] + './assets/');
  }

  return updated;
}

// Patch index.html
const indexHtmlPath = path.join(rootDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  fs.writeFileSync(indexHtmlPath, patchContent(html, false), 'utf8');
  console.log('Patched index.html for local relative paths.');
}

// Patch all JS modules in bundle/
if (fs.existsSync(bundleDir)) {
  const files = fs.readdirSync(bundleDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const filePath = path.join(bundleDir, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const patched = patchContent(raw, true);
    fs.writeFileSync(filePath, patched, 'utf8');
    console.log(`Patched bundle/${file}`);
  }
}

console.log('All files updated to run 100% locally without GitHub Pages!');
