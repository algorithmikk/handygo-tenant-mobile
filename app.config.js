/**
 * Dynamic Expo config. Overlays env-based Maps key and optional google-services.json.
 */
const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

const googleServicesPath = path.join(__dirname, 'google-services.json');
const hasGoogleServices = fs.existsSync(googleServicesPath);

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  runtimeVersion: appJson.expo.runtimeVersion || { policy: 'appVersion' },
  updates: {
    ...(appJson.expo.updates || {}),
    url: appJson.expo.updates?.url || `https://u.expo.dev/${appJson.expo.extra?.eas?.projectId || ''}`,
  },
  android: {
    ...appJson.expo.android,
    ...(hasGoogleServices ? { googleServicesFile: './google-services.json' } : {}),
    config: {
      ...(appJson.expo.android?.config || {}),
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      },
    },
  },
};
