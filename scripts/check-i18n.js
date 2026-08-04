/**
 * Fail the build when translation files drift apart.
 *
 * A key present in one locale but missing in another renders as the raw key
 * string in the UI, which is the kind of thing that reaches the App Store
 * unnoticed because nobody runs the app in French before shipping.
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const REFERENCE_LOCALE = 'en';

/** Flatten a nested translation object into dotted key paths. */
function flatten(obj, prefix = '') {
  const keys = new Set();
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const nested of flatten(value, full)) keys.add(nested);
    } else {
      keys.add(full);
    }
  }
  return keys;
}

function main() {
  const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));
  const locales = {};

  for (const file of files) {
    const name = path.basename(file, '.json');
    try {
      locales[name] = flatten(JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8')));
    } catch (err) {
      console.error(`${file} is not valid JSON: ${err.message}`);
      process.exit(1);
    }
  }

  const reference = locales[REFERENCE_LOCALE];
  if (!reference) {
    console.error(`Reference locale ${REFERENCE_LOCALE}.json not found`);
    process.exit(1);
  }

  let failed = false;
  for (const [name, keys] of Object.entries(locales)) {
    if (name === REFERENCE_LOCALE) continue;
    const missing = [...reference].filter((k) => !keys.has(k)).sort();
    const extra = [...keys].filter((k) => !reference.has(k)).sort();

    if (missing.length) {
      failed = true;
      console.error(`${name}.json is missing ${missing.length} key(s):`);
      missing.forEach((k) => console.error(`  - ${k}`));
    }
    if (extra.length) {
      failed = true;
      console.error(`${name}.json has ${extra.length} key(s) not in ${REFERENCE_LOCALE}.json:`);
      extra.forEach((k) => console.error(`  + ${k}`));
    }
  }

  if (failed) process.exit(1);
  console.log(`Translations in sync across ${Object.keys(locales).join(', ')} (${reference.size} keys)`);
}

main();
