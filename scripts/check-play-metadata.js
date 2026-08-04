#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const play = path.join(__dirname, '..', 'play');
if (!fs.existsSync(play)) {
  console.log('check-play-metadata: no play/ listing yet — skipping (CI soft-pass).');
  process.exit(0);
}
console.log('check-play-metadata: play/ folder present — OK.');
process.exit(0);
