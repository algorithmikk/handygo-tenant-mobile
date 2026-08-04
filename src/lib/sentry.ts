/**
 * Sentry is optional until EXPO_PUBLIC_SENTRY_DSN + @sentry/react-native are configured.
 */
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  // Install @sentry/react-native and wire here for production builds.
  console.log('[sentry] DSN present — wire @sentry/react-native when ready');
}
