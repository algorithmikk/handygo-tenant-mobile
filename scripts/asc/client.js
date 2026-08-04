/**
 * Minimal App Store Connect API client.
 *
 * Credentials resolve from environment first (so CI can inject them) and fall
 * back to the local key file used for manual runs:
 *   ASC_KEY_ID           - App Store Connect API key ID
 *   ASC_ISSUER_ID        - issuer UUID from the ASC Keys page
 *   ASC_APP_ID           - numeric app ID (the "Apple ID" in App Information)
 *   ASC_PRIVATE_KEY      - full .p8 contents (preferred in CI)
 *   ASC_PRIVATE_KEY_PATH - path to the .p8 file (defaults to ~/.appstoreconnect)
 */

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');

const KEY_ID = process.env.ASC_KEY_ID || 'A945G7BMSZ';
const ISSUER_ID = process.env.ASC_ISSUER_ID || '73d61e3d-d8c6-4a29-af54-9b71dcbcb92b';
const APP_ID = process.env.ASC_APP_ID || 'REPLACE_WITH_ASC_APP_ID';

const HOST = 'api.appstoreconnect.apple.com';

/** Read the signing key from env or disk, failing loudly if neither is present. */
function loadPrivateKey() {
  if (process.env.ASC_PRIVATE_KEY) {
    return process.env.ASC_PRIVATE_KEY.replace(/\\n/g, '\n');
  }
  const keyPath =
    process.env.ASC_PRIVATE_KEY_PATH ||
    path.join(os.homedir(), '.appstoreconnect', 'private_keys', `AuthKey_${KEY_ID}.p8`);

  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `App Store Connect private key not found at ${keyPath}. ` +
        'Set ASC_PRIVATE_KEY (contents) or ASC_PRIVATE_KEY_PATH.'
    );
  }
  return fs.readFileSync(keyPath, 'utf8');
}

function base64Url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/** Build a short-lived ES256 JWT. Apple rejects tokens with a lifetime over 20 minutes. */
function createToken() {
  const header = base64Url(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      iss: ISSUER_ID,
      exp: Math.floor(Date.now() / 1000) + 600,
      aud: 'appstoreconnect-v1',
    })
  );
  const signer = crypto.createSign('SHA256');
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = base64Url(signer.sign({ key: loadPrivateKey(), dsaEncoding: 'ieee-p1363' }));
  return `${header}.${payload}.${signature}`;
}

/**
 * Perform a request against the ASC API.
 * @returns {Promise<{status: number, body: any}>}
 */
function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      Authorization: `Bearer ${createToken()}`,
      'Content-Type': 'application/json',
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request({ host: HOST, path: urlPath, method, headers }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let parsed = null;
        if (raw) {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { raw };
          }
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Throw on any non-2xx response, surfacing Apple's error detail rather than a bare status.
 *
 * Apple's API returns sporadic 5xx and 429s on otherwise valid requests, so
 * retry those with backoff. 4xx responses other than 429 are real errors and
 * fail immediately.
 */
async function requestOrThrow(method, urlPath, body, { retries = 4 } = {}) {
  let lastRes;
  for (let attempt = 0; attempt <= retries; attempt++) {
    lastRes = await request(method, urlPath, body);
    if (lastRes.status < 400) return lastRes.body;

    const retryable = lastRes.status >= 500 || lastRes.status === 429;
    if (!retryable || attempt === retries) break;

    const delay = 2000 * 2 ** attempt;
    console.warn(`  ${method} ${urlPath} -> ${lastRes.status}, retrying in ${delay / 1000}s`);
    await sleep(delay);
  }

  const errors = lastRes.body && lastRes.body.errors ? lastRes.body.errors : [];
  const parts = [];
  for (const e of errors) {
    parts.push(`${e.title}: ${e.detail}`);
    const assoc = e.meta && e.meta.associatedErrors;
    if (assoc) {
      for (const [path, list] of Object.entries(assoc)) {
        for (const a of list || []) {
          parts.push(`  [${path}] ${a.title}: ${a.detail}`);
        }
      }
    }
  }
  const detail = parts.length ? parts.join('\n') : JSON.stringify(lastRes.body);
  throw new Error(`${method} ${urlPath} failed (${lastRes.status}) - ${detail}`);
}

const get = (p) => requestOrThrow('GET', p);
const post = (p, body) => requestOrThrow('POST', p, body);
const patch = (p, body) => requestOrThrow('PATCH', p, body);
const del = (p) => requestOrThrow('DELETE', p);

/**
 * Get the editable App Store version, i.e. the one not yet released.
 * Anything in READY_FOR_SALE is immutable and must not be patched.
 */
async function getEditableVersion(appId = APP_ID) {
  const res = await get(`/v1/apps/${appId}/appStoreVersions?limit=10`);
  const editableStates = [
    'PREPARE_FOR_SUBMISSION',
    'DEVELOPER_REJECTED',
    'REJECTED',
    'METADATA_REJECTED',
    'WAITING_FOR_REVIEW',
    'INVALID_BINARY',
  ];
  const version = (res.data || []).find((v) => {
    const state = v.attributes.appStoreState || v.attributes.appVersionState;
    return editableStates.includes(state);
  });
  if (!version) {
    throw new Error('No editable App Store version found. Create a new version in App Store Connect first.');
  }
  return version;
}

module.exports = {
  APP_ID,
  KEY_ID,
  ISSUER_ID,
  request,
  get,
  post,
  patch,
  del,
  getEditableVersion,
};
