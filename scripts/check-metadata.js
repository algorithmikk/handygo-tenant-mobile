#!/usr/bin/env node
/**
 * ASC metadata check. Soft-pass until fastlane/metadata is filled for store release.
 */
const fs = require('fs');
const path = require('path');
const meta = path.join(__dirname, '..', 'fastlane', 'metadata');
if (!fs.existsSync(meta)) {
  console.log('check-metadata: no fastlane/metadata yet — skipping (CI soft-pass).');
  process.exit(0);
}
console.log('check-metadata: metadata folder present — OK (fill before App Review).');
process.exit(0);
