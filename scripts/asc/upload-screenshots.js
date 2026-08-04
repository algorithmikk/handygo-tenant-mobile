/**
 * Upload screenshots from fastlane/screenshots to App Store Connect.
 *
 * Apple's upload is a four-step dance per image: reserve an appScreenshot to
 * get a set of upload operations, PUT the bytes to each operation's URL, then
 * mark the asset uploaded with an MD5 of the file so Apple can verify it.
 *
 * Layout:  fastlane/screenshots/<locale>/<NN_name>.png
 * Order is taken from the filename, which is why the shots are numbered.
 *
 * Usage:
 *   node scripts/asc/upload-screenshots.js
 *   node scripts/asc/upload-screenshots.js --display-type APP_IPHONE_67
 */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { URL } = require('url');
const { get, post, patch, del, getEditableVersion } = require('./client');

const SCREENSHOTS_DIR = path.join(__dirname, '..', '..', 'fastlane', 'screenshots');

// Apple files 6.9" and 6.7" iPhone screenshots under the same display type.
const DEFAULT_DISPLAY_TYPE = 'APP_IPHONE_67';

/** Send raw bytes to one of Apple's pre-signed upload operations. */
function uploadChunk(operation, buffer) {
  return new Promise((resolve, reject) => {
    const url = new URL(operation.url);
    const headers = {};
    for (const header of operation.requestHeaders || []) {
      headers[header.name] = header.value;
    }
    const chunk = buffer.subarray(operation.offset, operation.offset + operation.length);
    headers['Content-Length'] = chunk.length;

    const req = https.request(
      { host: url.host, path: url.pathname + url.search, method: operation.method, headers },
      (res) => {
        res.resume();
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`Upload chunk failed with ${res.statusCode}`));
          } else {
            resolve();
          }
        });
      }
    );
    req.on('error', reject);
    req.write(chunk);
    req.end();
  });
}

async function findOrCreateSet(localizationId, displayType) {
  const existing = await get(`/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets`);
  const match = (existing.data || []).find((s) => s.attributes.screenshotDisplayType === displayType);
  if (match) return match.id;

  const created = await post('/v1/appScreenshotSets', {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: displayType },
      relationships: {
        appStoreVersionLocalization: {
          data: { type: 'appStoreVersionLocalizations', id: localizationId },
        },
      },
    },
  });
  return created.data.id;
}

async function clearSet(setId) {
  const existing = await get(`/v1/appScreenshotSets/${setId}/appScreenshots`);
  for (const shot of existing.data || []) {
    await del(`/v1/appScreenshots/${shot.id}`);
  }
  if ((existing.data || []).length) {
    console.log(`  removed ${existing.data.length} existing screenshot(s)`);
  }
}

async function uploadOne(setId, filePath) {
  const buffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const reserved = await post('/v1/appScreenshots', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName, fileSize: buffer.length },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } },
    },
  });

  const screenshotId = reserved.data.id;
  for (const operation of reserved.data.attributes.uploadOperations || []) {
    await uploadChunk(operation, buffer);
  }

  await patch(`/v1/appScreenshots/${screenshotId}`, {
    data: {
      type: 'appScreenshots',
      id: screenshotId,
      attributes: {
        uploaded: true,
        sourceFileChecksum: crypto.createHash('md5').update(buffer).digest('hex'),
      },
    },
  });

  console.log(`  uploaded ${fileName} (${Math.round(buffer.length / 1024)} KB)`);
}

async function main() {
  const args = process.argv.slice(2);
  const typeIndex = args.indexOf('--display-type');
  const displayType = typeIndex >= 0 ? args[typeIndex + 1] : DEFAULT_DISPLAY_TYPE;

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    throw new Error(`${SCREENSHOTS_DIR} does not exist. Run scripts/capture-screenshots.sh first.`);
  }

  const version = await getEditableVersion();
  const localizations = await get(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`);

  const locales = fs
    .readdirSync(SCREENSHOTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  if (!locales.length) throw new Error('No locale directories under fastlane/screenshots');

  for (const locale of locales) {
    const localization = (localizations.data || []).find((l) => l.attributes.locale === locale);
    if (!localization) {
      console.warn(`Skipping ${locale}: no matching App Store localization`);
      continue;
    }

    const files = fs
      .readdirSync(path.join(SCREENSHOTS_DIR, locale))
      // Skip scratch / probe captures (leading underscore) and non-images.
      .filter((f) => /\.(png|jpg|jpeg)$/i.test(f) && !f.startsWith('_') && !f.startsWith('.'))
      .sort();

    if (!files.length) {
      console.warn(`Skipping ${locale}: no images found`);
      continue;
    }

    console.log(`${locale} (${displayType}): ${files.length} image(s)`);
    const setId = await findOrCreateSet(localization.id, displayType);
    await clearSet(setId);

    for (const file of files) {
      await uploadOne(setId, path.join(SCREENSHOTS_DIR, locale, file));
    }
  }

  console.log('Screenshot upload complete.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
