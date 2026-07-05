const path = require('node:path');

const appBundleId = 'com.verticalspanish.app';
const isLocalBuild = process.env.VS_ELECTRON_LOCAL_BUILD === '1';
const codesignIdentity = process.env.MAC_CODESIGN_IDENTITY || (isLocalBuild ? '-' : undefined);
const hasDeveloperIdIdentity = Boolean(codesignIdentity && codesignIdentity !== '-');
const entitlementsPath = path.resolve(__dirname, 'build', 'entitlements.mac.plist');

function getNotarizeConfig() {
  if (!hasDeveloperIdIdentity) {
    return undefined;
  }

  if (process.env.APPLE_NOTARIZE_KEYCHAIN_PROFILE) {
    return {
      tool: 'notarytool',
      keychainProfile: process.env.APPLE_NOTARIZE_KEYCHAIN_PROFILE,
    };
  }

  if (process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID) {
    return {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    };
  }

  if (process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER) {
    return {
      tool: 'notarytool',
      appleApiKey: process.env.APPLE_API_KEY,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiIssuer: process.env.APPLE_API_ISSUER,
    };
  }

  return undefined;
}

module.exports = {
  packagerConfig: {
    name: 'Vertical Spanish',
    executableName: 'Vertical Spanish',
    appBundleId,
    appCategoryType: 'public.app-category.education',
    asar: true,
    icon: path.resolve(__dirname, 'assets', 'icon.icns'),
    osxSign: {
      identity: codesignIdentity,
      identityValidation: hasDeveloperIdIdentity,
      optionsForFile: () => ({
        entitlements: entitlementsPath,
        hardenedRuntime: true,
      }),
    },
    osxNotarize: getNotarizeConfig(),
    extendInfo: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
      },
      NSAudioCaptureUsageDescription: 'Vertical Spanish does not request audio capture access.',
      NSBluetoothAlwaysUsageDescription: 'Vertical Spanish does not request Bluetooth access.',
      NSBluetoothPeripheralUsageDescription: 'Vertical Spanish does not request Bluetooth access.',
      NSCameraUsageDescription: 'Vertical Spanish does not request camera access.',
      NSMicrophoneUsageDescription: 'Vertical Spanish does not request microphone access.',
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        name: 'Vertical-Spanish',
        format: 'ULFO',
      },
    },
  ],
};
