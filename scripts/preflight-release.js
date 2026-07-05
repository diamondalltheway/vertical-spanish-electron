const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasKeychainNotarization(env) {
  return hasValue(env.APPLE_NOTARIZE_KEYCHAIN_PROFILE);
}

function hasAppleIdNotarization(env) {
  return hasValue(env.APPLE_ID) && hasValue(env.APPLE_APP_SPECIFIC_PASSWORD) && hasValue(env.APPLE_TEAM_ID);
}

function hasApiKeyNotarization(env, fileExists = fs.existsSync) {
  return (
    hasValue(env.APPLE_API_KEY) &&
    fileExists(env.APPLE_API_KEY) &&
    hasValue(env.APPLE_API_KEY_ID) &&
    hasValue(env.APPLE_API_ISSUER)
  );
}

function hasNotarizationCredentials(env, fileExists = fs.existsSync) {
  return hasKeychainNotarization(env) || hasAppleIdNotarization(env) || hasApiKeyNotarization(env, fileExists);
}

function identityIsInstalled(identity, identitiesOutput) {
  if (!hasValue(identity) || identity === '-') {
    return false;
  }

  return identitiesOutput.includes(`"${identity}"`) || identitiesOutput.includes(identity);
}

function validateReleaseEnvironment(env, identitiesOutput, fileExists = fs.existsSync) {
  const errors = [];
  const identity = env.MAC_CODESIGN_IDENTITY;

  if (!hasValue(identity) || identity === '-') {
    errors.push('Set MAC_CODESIGN_IDENTITY to a Developer ID Application certificate name.');
  } else if (!identityIsInstalled(identity, identitiesOutput)) {
    errors.push(`MAC_CODESIGN_IDENTITY was not found in the local keychain: ${identity}`);
  }

  if (!hasNotarizationCredentials(env, fileExists)) {
    errors.push(
      'Set notarization credentials using APPLE_NOTARIZE_KEYCHAIN_PROFILE, Apple ID credentials, or App Store Connect API key credentials.',
    );
  }

  return errors;
}

function getCodesigningIdentities() {
  return execFileSync('security', ['find-identity', '-v', '-p', 'codesigning'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function main() {
  const identitiesOutput = getCodesigningIdentities();
  const errors = validateReleaseEnvironment(process.env, identitiesOutput);

  if (errors.length > 0) {
    console.error('Release signing preflight failed.');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    console.error('\nUse `npm run make:local` for an ad-hoc local-only build.');
    process.exit(1);
  }

  console.log('Release signing preflight passed.');
}

if (require.main === module) {
  main();
}

module.exports = {
  hasNotarizationCredentials,
  identityIsInstalled,
  validateReleaseEnvironment,
};
