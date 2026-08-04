/**
 * Turn on Apple's phased release for the editable version.
 *
 * Without this, a version goes to 100% of users the moment review passes. With
 * it, Apple ramps over 7 days (1, 2, 5, 10, 20, 50, 100 percent) and the
 * rollout can be paused at any point. Since iOS has no true rollback, pausing
 * the ramp is the only lever available when a bad build ships.
 *
 * The record is created in INACTIVE state; Apple activates it at release.
 *
 * Usage: node scripts/asc/enable-phased-release.js
 */

const { get, post, getEditableVersion } = require('./client');

async function main() {
  const version = await getEditableVersion();
  console.log(`Enabling phased release on version ${version.attributes.versionString}`);

  let existing = null;
  try {
    const res = await get(`/v1/appStoreVersions/${version.id}/appStoreVersionPhasedRelease`);
    existing = res.data;
  } catch (err) {
    if (!/\(404\)/.test(err.message)) throw err;
  }

  if (existing) {
    console.log(`Phased release already configured (state=${existing.attributes.phasedReleaseState})`);
    return;
  }

  await post('/v1/appStoreVersionPhasedReleases', {
    data: {
      type: 'appStoreVersionPhasedReleases',
      attributes: { phasedReleaseState: 'INACTIVE' },
      relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } },
    },
  });

  console.log('Phased release enabled. Apple will ramp 1/2/5/10/20/50/100% over 7 days after approval.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
