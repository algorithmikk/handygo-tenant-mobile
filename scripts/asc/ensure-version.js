/**
 * Ensure an editable App Store version record exists for a given marketing version.
 *
 * Creates the record if the only versions present are already released, and
 * renames a mismatched editable record so it matches the binary's
 * CFBundleShortVersionString. Apple will not attach a build whose version string
 * disagrees with the version record it is being submitted under.
 *
 * Usage: node scripts/asc/ensure-version.js 1.0.0
 */

const { APP_ID, get, post, patch } = require('./client');

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node scripts/asc/ensure-version.js <versionString>');
    process.exit(1);
  }

  const res = await get(`/v1/apps/${APP_ID}/appStoreVersions?limit=10`);
  const versions = res.data || [];
  const stateOf = (v) => v.attributes.appStoreState || v.attributes.appVersionState;

  const exact = versions.find((v) => v.attributes.versionString === target);
  if (exact) {
    console.log(`Version ${target} already exists (state=${stateOf(exact)}, id=${exact.id})`);
    return;
  }

  const editableStates = ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'];
  const editable = versions.find((v) => editableStates.includes(stateOf(v)));

  if (editable) {
    console.log(`Renaming editable version ${editable.attributes.versionString} -> ${target}`);
    await patch(`/v1/appStoreVersions/${editable.id}`, {
      data: {
        type: 'appStoreVersions',
        id: editable.id,
        attributes: { versionString: target },
      },
    });
    console.log(`Version record now ${target} (id=${editable.id})`);
    return;
  }

  console.log(`Creating new version record ${target}`);
  const created = await post('/v1/appStoreVersions', {
    data: {
      type: 'appStoreVersions',
      attributes: { platform: 'IOS', versionString: target },
      relationships: { app: { data: { type: 'apps', id: APP_ID } } },
    },
  });
  console.log(`Created version ${target} (id=${created.data.id})`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
