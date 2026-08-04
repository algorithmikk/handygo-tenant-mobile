/**
 * Answer the App Store age rating questionnaire.
 *
 * UMAMEATS is a food ordering app with no objectionable content, no gambling,
 * no in-app browser and no user-to-user messaging, so every question is NONE or
 * false. The one judgement call is alcohol: set
 * alcoholTobaccoOrDrugUseOrReferences to INFREQUENT_OR_MILD if the catalogue
 * ever lists alcoholic drinks, which also raises the rating to 17+.
 *
 * Usage: node scripts/asc/set-age-rating.js
 */

const { APP_ID, get, patch } = require('./client');

const DECLARATION = {
  // Content descriptors, all NONE for a food ordering app.
  alcoholTobaccoOrDrugUseOrReferences: 'NONE',
  contests: 'NONE',
  gamblingSimulated: 'NONE',
  gunsOrOtherWeapons: 'NONE',
  horrorOrFearThemes: 'NONE',
  matureOrSuggestiveThemes: 'NONE',
  medicalOrTreatmentInformation: 'NONE',
  profanityOrCrudeHumor: 'NONE',
  sexualContentGraphicAndNudity: 'NONE',
  sexualContentOrNudity: 'NONE',
  violenceCartoonOrFantasy: 'NONE',
  violenceRealistic: 'NONE',
  violenceRealisticProlongedGraphicOrSadistic: 'NONE',

  // Capability questions.
  gambling: false,
  unrestrictedWebAccess: false,
  lootBox: false,
  advertising: false,
  parentalControls: false,
  healthOrWellnessTopics: false,
  ageAssurance: false,

  // No in-app messaging of any kind: customers never contact drivers or each
  // other through the app.
  messagingAndChat: false,

  // Customers write reviews, but the app never renders another customer's
  // review text - store pages show only an aggregate rating and a count, and
  // reviewService exposes no "reviews for this store" listing. Revisit this the
  // moment other people's reviews become visible in the app, because answering
  // true also obliges us to ship moderation, reporting and blocking.
  userGeneratedContent: false,

  kidsAgeBand: null,
};

async function main() {
  const infos = await get(`/v1/apps/${APP_ID}/appInfos`);
  const info = (infos.data || []).find((i) => {
    const state = i.attributes.appStoreState || i.attributes.state;
    return state !== 'READY_FOR_SALE';
  }) || infos.data[0];

  const related = await get(`/v1/appInfos/${info.id}?include=ageRatingDeclaration`);
  const declaration = (related.included || []).find((i) => i.type === 'ageRatingDeclarations');
  if (!declaration) {
    throw new Error('No ageRatingDeclaration found on this app info');
  }

  await patch(`/v1/ageRatingDeclarations/${declaration.id}`, {
    data: { type: 'ageRatingDeclarations', id: declaration.id, attributes: DECLARATION },
  });

  const updated = await get(`/v1/appInfos/${info.id}`);
  console.log(`Age rating questionnaire submitted. Rating: ${updated.data.attributes.appStoreAgeRating || 'pending'}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
