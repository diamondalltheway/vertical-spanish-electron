const path = require('node:path');

module.exports = {
  packagerConfig: {
    name: 'Vertical Spanish',
    executableName: 'Vertical Spanish',
    appBundleId: 'com.verticalspanish.app',
    appCategoryType: 'public.app-category.education',
    asar: true,
    icon: path.resolve(__dirname, 'assets', 'icon.icns'),
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
