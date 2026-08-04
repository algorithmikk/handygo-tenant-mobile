/**
 * Pre-submission readiness check.
 *
 * Verifies everything Apple requires before a version can be submitted, and
 * exits non-zero if any blocker is outstanding. Run this in the release
 * workflow before submit-for-review.js so a bad submission fails in CI rather
 * than sitting in Apple's queue for a day and coming back rejected.
 *
 * Usage: node scripts/asc/audit.js
 */

const { APP_ID, get, getEditableVersion } = require('./client');

const blockers = [];
const warnings = [];

function check(label, ok, detail) {
  console.log(`  ${ok ? 'OK  ' : 'MISS'} ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) blockers.push(label);
}

function warn(label, ok, detail) {
  console.log(`  ${ok ? 'OK  ' : 'WARN'} ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) warnings.push(label);
}

/** Some sub-resources 404 when never configured; treat that as absent rather than fatal. */
async function getOrNull(path) {
  try {
    return await get(path);
    } catch (err) {
    if (/\((404|409)\)/.test(err.message)) return null;
    throw err;
  }
}

async function main() {
  const version = await getEditableVersion();
  const versionId = version.id;
  const state = version.attributes.appStoreState || version.attributes.appVersionState;
  console.log(`App ${APP_ID}, version ${version.attributes.versionString} (${state})\n`);

  console.log('Version localizations');
  const locs = await get(`/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations`);
  for (const loc of locs.data || []) {
    const a = loc.attributes;
    console.log(` locale ${a.locale}`);
    check(`  description`, Boolean(a.description), a.description ? `${a.description.length} chars` : null);
    check(`  keywords`, Boolean(a.keywords));
    check(`  supportUrl`, Boolean(a.supportUrl), a.supportUrl);
    const shots = await get(`/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`);
    const sets = shots.data || [];
    check(`  screenshots`, sets.length > 0, sets.map((s) => s.attributes.screenshotDisplayType).join(', '));
  }

  console.log('\nApp info');
  const infos = await get(`/v1/apps/${APP_ID}/appInfos`);
  const info = (infos.data || []).find((i) => {
    const s = i.attributes.appStoreState || i.attributes.state;
    return s !== 'READY_FOR_SALE';
  }) || infos.data[0];

  check('  age rating', Boolean(info.attributes.appStoreAgeRating), info.attributes.appStoreAgeRating);

  const categories = await get(`/v1/appInfos/${info.id}?include=primaryCategory,secondaryCategory`);
  const included = categories.included || [];
  check('  primary category', included.length > 0, included.map((c) => c.id).join(', '));

  const infoLocs = await get(`/v1/appInfos/${info.id}/appInfoLocalizations`);
  for (const loc of infoLocs.data || []) {
    const a = loc.attributes;
    check(`  privacy policy URL (${a.locale})`, Boolean(a.privacyPolicyUrl), a.privacyPolicyUrl);
    warn(`  subtitle (${a.locale})`, Boolean(a.subtitle), a.subtitle);
  }

  console.log('\nApp Review');
  const detail = await getOrNull(`/v1/appStoreVersions/${versionId}/appStoreReviewDetail`);
  if (!detail || !detail.data) {
    check('  review detail record', false);
  } else {
    const a = detail.data.attributes;
    check('  contact email', Boolean(a.contactEmail), a.contactEmail);
    check('  contact phone', Boolean(a.contactPhone));
    check('  demo account', Boolean(a.demoAccountName), a.demoAccountName);
    warn('  reviewer notes', Boolean(a.notes), a.notes ? `${a.notes.length} chars` : null);
  }

  console.log('\nBuild and release');
  const build = await getOrNull(`/v1/appStoreVersions/${versionId}/build`);
  check('  build attached', Boolean(build && build.data), build && build.data ? build.data.id : null);

  const phased = await getOrNull(`/v1/appStoreVersions/${versionId}/appStoreVersionPhasedRelease`);
  warn('  phased release', Boolean(phased && phased.data),
    phased && phased.data ? phased.data.attributes.phasedReleaseState : 'will release to 100% at once');

  const pricing = await getOrNull(`/v1/apps/${APP_ID}/appPriceSchedule`);
  check('  price schedule', Boolean(pricing && pricing.data));

  // The App Privacy label has no public API, so it cannot be audited here.
  console.log('\n  n/a  App Privacy label - verify by hand, see fastlane/PRIVACY.md');

  console.log('');
  if (warnings.length) {
    console.log(`${warnings.length} warning(s): ${warnings.map((w) => w.trim()).join(', ')}`);
  }
  if (blockers.length) {
    console.error(`${blockers.length} blocker(s) must be resolved before submitting:`);
    blockers.forEach((b) => console.error(`  - ${b.trim()}`));
    process.exit(1);
  }
  console.log('All submission blockers clear.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
