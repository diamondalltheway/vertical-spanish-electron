const assert = require('node:assert/strict');
const test = require('node:test');
const {
  hasNotarizationCredentials,
  identityIsInstalled,
  validateReleaseEnvironment,
} = require('../../scripts/preflight-release');

const identitiesOutput = '  1) ABCDEF1234567890 "Developer ID Application: Vertical Spanish (TEAMID)"\n     1 valid identities found\n';

test('rejects missing or ad-hoc signing identities for release builds', () => {
  assert.equal(identityIsInstalled(undefined, identitiesOutput), false);
  assert.equal(identityIsInstalled('-', identitiesOutput), false);

  const missingIdentityErrors = validateReleaseEnvironment(
    { APPLE_NOTARIZE_KEYCHAIN_PROFILE: 'vertical-spanish-notary' },
    identitiesOutput,
  );
  assert.match(missingIdentityErrors.join('\n'), /MAC_CODESIGN_IDENTITY/);

  const adHocIdentityErrors = validateReleaseEnvironment(
    { MAC_CODESIGN_IDENTITY: '-', APPLE_NOTARIZE_KEYCHAIN_PROFILE: 'vertical-spanish-notary' },
    identitiesOutput,
  );
  assert.match(adHocIdentityErrors.join('\n'), /Developer ID Application/);
});

test('rejects identities that are not installed in the local keychain', () => {
  const errors = validateReleaseEnvironment(
    {
      MAC_CODESIGN_IDENTITY: 'Developer ID Application: Other App (TEAMID)',
      APPLE_NOTARIZE_KEYCHAIN_PROFILE: 'vertical-spanish-notary',
    },
    identitiesOutput,
  );

  assert.deepEqual(errors, [
    'MAC_CODESIGN_IDENTITY was not found in the local keychain: Developer ID Application: Other App (TEAMID)',
  ]);
});

test('accepts Developer ID identity with keychain profile notarization', () => {
  const errors = validateReleaseEnvironment(
    {
      MAC_CODESIGN_IDENTITY: 'Developer ID Application: Vertical Spanish (TEAMID)',
      APPLE_NOTARIZE_KEYCHAIN_PROFILE: 'vertical-spanish-notary',
    },
    identitiesOutput,
  );

  assert.deepEqual(errors, []);
});

test('accepts Developer ID identity with Apple ID notarization credentials', () => {
  const errors = validateReleaseEnvironment(
    {
      MAC_CODESIGN_IDENTITY: 'Developer ID Application: Vertical Spanish (TEAMID)',
      APPLE_ID: 'developer@example.com',
      APPLE_APP_SPECIFIC_PASSWORD: 'xxxx-xxxx-xxxx-xxxx',
      APPLE_TEAM_ID: 'TEAMID',
    },
    identitiesOutput,
  );

  assert.deepEqual(errors, []);
});

test('accepts API key notarization only when the key file exists', () => {
  const env = {
    MAC_CODESIGN_IDENTITY: 'Developer ID Application: Vertical Spanish (TEAMID)',
    APPLE_API_KEY: '/secure/AuthKey_KEYID.p8',
    APPLE_API_KEY_ID: 'KEYID',
    APPLE_API_ISSUER: 'issuer-uuid',
  };

  assert.equal(hasNotarizationCredentials(env, () => false), false);
  assert.deepEqual(validateReleaseEnvironment(env, identitiesOutput, () => false), [
    'Set notarization credentials using APPLE_NOTARIZE_KEYCHAIN_PROFILE, Apple ID credentials, or App Store Connect API key credentials.',
  ]);
  assert.equal(hasNotarizationCredentials(env, () => true), true);
  assert.deepEqual(validateReleaseEnvironment(env, identitiesOutput, () => true), []);
});
