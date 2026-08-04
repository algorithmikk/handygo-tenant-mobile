/**
 * Push App Store listing metadata from fastlane/metadata to App Store Connect.
 *
 * Uses the conventional fastlane "deliver" directory layout so the listing stays
 * reviewable in git, but talks to the ASC API directly. CI is Node-only, and
 * adding a Ruby toolchain just to copy text fields is not worth it.
 *
 * Layout:
 *   fastlane/metadata/copyright.txt
 *   fastlane/metadata/primary_category.txt
 *   fastlane/metadata/secondary_category.txt
 *   fastlane/metadata/<locale>/{name,subtitle,description,keywords,
 *                              promotional_text,release_notes,
 *                              support_url,marketing_url,privacy_url}.txt
 *
 * Usage: node scripts/asc/sync-metadata.js
 */

const fs = require('fs');
const path = require('path');
const { APP_ID, get, patch, getEditableVersion } = require('./client');

const METADATA_DIR = path.join(__dirname, '..', '..', 'fastlane', 'metadata');

/** Read a metadata file, returning null when it is absent or empty. */
function readField(...segments) {
  const filePath = path.join(METADATA_DIR, ...segments);
  if (!fs.existsSync(filePath)) return null;
  const value = fs.readFileSync(filePath, 'utf8').trim();
  return value.length ? value : null;
}

function listLocales() {
  return fs
    .readdirSync(METADATA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'review_information')
    .map((entry) => entry.name);
}

/** Apple silently truncates or rejects overlong fields, so fail before sending. */
const LIMITS = {
  name: 30,
  subtitle: 30,
  keywords: 100,
  promotionalText: 170,
  description: 4000,
  whatsNew: 4000,
};

function assertWithinLimits(fields) {
  for (const [field, limit] of Object.entries(LIMITS)) {
    const value = fields[field];
    if (value && value.length > limit) {
      throw new Error(`${field} is ${value.length} characters, over Apple's ${limit} limit`);
    }
  }
}

async function syncVersionLocalization(versionId, locale) {
  const fields = {
    description: readField(locale, 'description.txt'),
    keywords: readField(locale, 'keywords.txt'),
    promotionalText: readField(locale, 'promotional_text.txt'),
    whatsNew: readField(locale, 'release_notes.txt'),
    supportUrl: readField(locale, 'support_url.txt'),
    marketingUrl: readField(locale, 'marketing_url.txt'),
  };
  assertWithinLimits(fields);

  const existing = await get(`/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations`);
  const match = (existing.data || []).find((l) => l.attributes.locale === locale);
  if (!match) {
    throw new Error(`No appStoreVersionLocalization for ${locale}. Add the locale in App Store Connect first.`);
  }

  // whatsNew is rejected on a version that has never been released.
  const attributes = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null));
  const isFirstRelease = !(await hasReleasedVersion());
  if (isFirstRelease) delete attributes.whatsNew;

  await patch(`/v1/appStoreVersionLocalizations/${match.id}`, {
    data: { type: 'appStoreVersionLocalizations', id: match.id, attributes },
  });
  console.log(`  version localization ${locale}: ${Object.keys(attributes).join(', ')}`);
}

let releasedVersionCache;
async function hasReleasedVersion() {
  if (releasedVersionCache !== undefined) return releasedVersionCache;
  const res = await get(`/v1/apps/${APP_ID}/appStoreVersions?limit=20`);
  releasedVersionCache = (res.data || []).some((v) => {
    const state = v.attributes.appStoreState || v.attributes.appVersionState;
    return state === 'READY_FOR_SALE' || state === 'REPLACED_WITH_NEW_VERSION';
  });
  return releasedVersionCache;
}

async function syncAppInfoLocalization(appInfoId, locale) {
  const fields = {
    name: readField(locale, 'name.txt'),
    subtitle: readField(locale, 'subtitle.txt'),
    privacyPolicyUrl: readField(locale, 'privacy_url.txt'),
  };
  assertWithinLimits(fields);

  const existing = await get(`/v1/appInfos/${appInfoId}/appInfoLocalizations`);
  const match = (existing.data || []).find((l) => l.attributes.locale === locale);
  if (!match) {
    throw new Error(`No appInfoLocalization for ${locale}`);
  }

  const attributes = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null));
  await patch(`/v1/appInfoLocalizations/${match.id}`, {
    data: { type: 'appInfoLocalizations', id: match.id, attributes },
  });
  console.log(`  app info localization ${locale}: ${Object.keys(attributes).join(', ')}`);
}

async function syncCategories(appInfoId) {
  const primary = readField('primary_category.txt');
  const secondary = readField('secondary_category.txt');
  if (!primary && !secondary) return;

  const relationships = {};
  if (primary) {
    relationships.primaryCategory = { data: { type: 'appCategories', id: primary } };
  }
  if (secondary) {
    relationships.secondaryCategory = { data: { type: 'appCategories', id: secondary } };
  }

  await patch(`/v1/appInfos/${appInfoId}`, {
    data: { type: 'appInfos', id: appInfoId, relationships },
  });
  console.log(`  categories: primary=${primary || '-'} secondary=${secondary || '-'}`);
}

async function syncCopyright(versionId) {
  const copyright = readField('copyright.txt');
  if (!copyright) return;
  await patch(`/v1/appStoreVersions/${versionId}`, {
    data: { type: 'appStoreVersions', id: versionId, attributes: { copyright } },
  });
  console.log(`  copyright: ${copyright}`);
}

async function main() {
  const version = await getEditableVersion();
  const versionId = version.id;
  console.log(
    `Syncing metadata to version ${version.attributes.versionString} ` +
      `(${version.attributes.appStoreState || version.attributes.appVersionState})`
  );

  const appInfos = await get(`/v1/apps/${APP_ID}/appInfos`);
  const editableAppInfo = (appInfos.data || []).find((info) => {
    const state = info.attributes.appStoreState || info.attributes.state;
    return state !== 'READY_FOR_SALE';
  }) || appInfos.data[0];

  await syncCopyright(versionId);
  await syncCategories(editableAppInfo.id);

  for (const locale of listLocales()) {
    console.log(`Locale ${locale}`);
    await syncVersionLocalization(versionId, locale);
    await syncAppInfoLocalization(editableAppInfo.id, locale);
  }

  console.log('Metadata sync complete.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
