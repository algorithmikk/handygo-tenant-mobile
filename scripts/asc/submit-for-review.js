/**
 * Attach the latest processed build to the editable version and submit it for
 * App Review.
 *
 * Uses the reviewSubmissions API (the appStoreVersionSubmissions endpoint it
 * replaced is deprecated). The flow is: create a submission, add the version to
 * it as an item, then flip submitted to true.
 *
 * Usage: node scripts/asc/submit-for-review.js [--build-number <n>]
 */

const { APP_ID, get, post, patch, getEditableVersion } = require('./client');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Find a build that Apple has finished processing; VALID is the only submittable state. */
async function findBuild(buildNumber) {
  const res = await get(`/v1/builds?filter%5Bapp%5D=${APP_ID}&limit=25&sort=-uploadedDate`);
  const builds = res.data || [];

  if (buildNumber) {
    const match = builds.find((b) => b.attributes.version === String(buildNumber));
    if (!match) throw new Error(`Build ${buildNumber} not found for this app`);
    return match;
  }
  const valid = builds.find((b) => b.attributes.processingState === 'VALID');
  if (!valid) {
    const states = builds.slice(0, 3).map((b) => `${b.attributes.version}=${b.attributes.processingState}`);
    throw new Error(`No build in VALID state yet. Recent: ${states.join(', ') || 'none'}`);
  }
  return valid;
}

async function waitForProcessing(build) {
  let current = build;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (current.attributes.processingState === 'VALID') return current;
    if (current.attributes.processingState === 'INVALID' || current.attributes.processingState === 'FAILED') {
      throw new Error(`Build ${current.attributes.version} is ${current.attributes.processingState}`);
    }
    console.log(`  build ${current.attributes.version} is ${current.attributes.processingState}, waiting 60s`);
    await sleep(60000);
    const res = await get(`/v1/builds/${current.id}`);
    current = res.data;
  }
  throw new Error('Timed out waiting for Apple to finish processing the build');
}

async function main() {
  const args = process.argv.slice(2);
  const buildFlagIndex = args.indexOf('--build-number');
  const buildNumber = buildFlagIndex >= 0 ? args[buildFlagIndex + 1] : null;

  const version = await getEditableVersion();
  const state = version.attributes.appStoreState || version.attributes.appVersionState;
  console.log(`Version ${version.attributes.versionString} (${state})`);

  if (state === 'WAITING_FOR_REVIEW' || state === 'IN_REVIEW') {
    console.log('Version is already submitted; nothing to do.');
    return;
  }

  // Screenshots are required; fail early with a clear message.
  const locs = await get(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`);
  let screenshotCount = 0;
  for (const loc of locs.data || []) {
    const sets = await get(`/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`);
    for (const set of sets.data || []) {
      const shots = await get(`/v1/appScreenshotSets/${set.id}/appScreenshots`);
      screenshotCount += (shots.data || []).length;
    }
  }
  if (screenshotCount === 0) {
    throw new Error(
      'No App Store screenshots found. Upload with `node scripts/asc/upload-screenshots.js` before submitting.'
    );
  }
  console.log(`Screenshots present: ${screenshotCount}`);

  let build = await findBuild(buildNumber);
  build = await waitForProcessing(build);
  console.log(`Attaching build ${build.attributes.version}`);

  await patch(`/v1/appStoreVersions/${version.id}`, {
    data: {
      type: 'appStoreVersions',
      id: version.id,
      relationships: { build: { data: { type: 'builds', id: build.id } } },
    },
  });

  // Reuse an open review submission if a previous run created one but failed
  // before adding the version item (orphaned READY_FOR_REVIEW with no items).
  let submissionId = null;
  const existing = await get(`/v1/reviewSubmissions?filter%5Bapp%5D=${APP_ID}&limit=10`);
  for (const s of existing.data || []) {
    const st = s.attributes.state;
    if (st === 'READY_FOR_REVIEW' || st === 'UNRESOLVED_ISSUES') {
      submissionId = s.id;
      console.log(`Reusing review submission ${submissionId} (${st})`);
      break;
    }
  }

  if (!submissionId) {
    const submission = await post('/v1/reviewSubmissions', {
      data: {
        type: 'reviewSubmissions',
        attributes: { platform: 'IOS' },
        relationships: { app: { data: { type: 'apps', id: APP_ID } } },
      },
    });
    submissionId = submission.data.id;
    console.log(`Created review submission ${submissionId}`);
  }

  // Skip adding the item if this submission already has the version.
  const items = await get(`/v1/reviewSubmissions/${submissionId}/items`);
  const alreadyLinked = (items.data || []).some(
    (i) => i.relationships?.appStoreVersion?.data?.id === version.id
  );
  if (!alreadyLinked) {
    await post('/v1/reviewSubmissionItems', {
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: submissionId } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } },
        },
      },
    });
    console.log('Attached appStoreVersion to review submission');
  } else {
    console.log('Version already attached to review submission');
  }

  await patch(`/v1/reviewSubmissions/${submissionId}`, {
    data: { type: 'reviewSubmissions', id: submissionId, attributes: { submitted: true } },
  });

  console.log(`Submitted version ${version.attributes.versionString} for App Review.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
