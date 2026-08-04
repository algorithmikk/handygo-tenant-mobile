/**
 * Push App Review contact details, demo account and reviewer notes.
 *
 * Reads fastlane/metadata/review_information. The demo password is read from
 * ASC_DEMO_PASSWORD when set, otherwise from the (gitignored) local file, so CI
 * never needs the credential committed.
 *
 * Usage: node scripts/asc/set-review-details.js
 */

const fs = require('fs');
const path = require('path');
const { get, post, patch, getEditableVersion } = require('./client');

const REVIEW_DIR = path.join(__dirname, '..', '..', 'fastlane', 'metadata', 'review_information');

function readField(name) {
  const filePath = path.join(REVIEW_DIR, name);
  if (!fs.existsSync(filePath)) return null;
  const value = fs.readFileSync(filePath, 'utf8').trim();
  return value.length ? value : null;
}

function requireField(name) {
  const value = readField(name);
  if (!value) {
    throw new Error(`fastlane/metadata/review_information/${name} is missing or empty`);
  }
  if (value === 'REPLACE_ME') {
    throw new Error(
      `fastlane/metadata/review_information/${name} still contains the REPLACE_ME placeholder. ` +
        'Apple requires a reachable contact for App Review.'
    );
  }
  return value;
}

async function main() {
  const demoPassword = process.env.ASC_DEMO_PASSWORD || readField('demo_password.txt');
  const demoUser = readField('demo_user.txt');

  if (demoUser && !demoPassword) {
    throw new Error('A demo account username is configured but no password. Set ASC_DEMO_PASSWORD.');
  }

  // Prefer ASC_CONTACT_PHONE so a real reachable number never has to sit in git.
  // The committed file is a valid-format fallback for local dry runs.
  const contactPhone = process.env.ASC_CONTACT_PHONE || requireField('phone_number.txt');

  const attributes = {
    contactFirstName: requireField('first_name.txt'),
    contactLastName: requireField('last_name.txt'),
    contactPhone,
    contactEmail: requireField('email_address.txt'),
    demoAccountRequired: Boolean(demoUser),
    notes: readField('notes.txt') || '',
  };

  if (demoUser) {
    attributes.demoAccountName = demoUser;
    attributes.demoAccountPassword = demoPassword;
  }

  const version = await getEditableVersion();
  console.log(`Setting review details on version ${version.attributes.versionString}`);

  let existingId = null;
  try {
    const existing = await get(`/v1/appStoreVersions/${version.id}/appStoreReviewDetail`);
    existingId = existing.data ? existing.data.id : null;
  } catch (err) {
    // A version that has never had review details returns 404 here; that is expected.
    if (!/\(404\)/.test(err.message)) throw err;
  }

  if (existingId) {
    await patch(`/v1/appStoreReviewDetails/${existingId}`, {
      data: { type: 'appStoreReviewDetails', id: existingId, attributes },
    });
    console.log('Updated existing App Review detail');
  } else {
    await post('/v1/appStoreReviewDetails', {
      data: {
        type: 'appStoreReviewDetails',
        attributes,
        relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } },
      },
    });
    console.log('Created App Review detail');
  }

  console.log(`  contact: ${attributes.contactFirstName} ${attributes.contactLastName} <${attributes.contactEmail}>`);
  console.log(`  demo account: ${demoUser || '(none)'}`);
  console.log(`  notes: ${attributes.notes.length} characters`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
