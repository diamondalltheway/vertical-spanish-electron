# Vertical Spanish Electron

A small macOS Electron wrapper around `https://verticalspanish.com/`.

## Commands

```bash
npm install
npm run generate:icons
npm start
npm test
npm run make:local
```

`npm run make:local` creates ad-hoc signed macOS DMG and ZIP artifacts in
`out/make` for local testing only. Do not publish those artifacts on the website.

## Public macOS Releases

Public downloads need a Developer ID signature and Apple notarization. Set one of
the notarization credential groups before running `npm run make`:

```bash
export MAC_CODESIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)"

# Option A: notarytool keychain profile
export APPLE_NOTARIZE_KEYCHAIN_PROFILE="vertical-spanish-notary"

# Option B: Apple ID app-specific password
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="TEAMID"

# Option C: App Store Connect API key
export APPLE_API_KEY="/path/to/AuthKey_KEYID.p8"
export APPLE_API_KEY_ID="KEYID"
export APPLE_API_ISSUER="issuer-uuid"
```

`npm run make` runs a release preflight and fails if those values are missing.
If `MAC_CODESIGN_IDENTITY` is not set, use `npm run make:local`; that build is
not suitable for website downloads.

## Notes

- The website stays on `verticalspanish.com`; external HTTPS and mail links open in the default browser.
- The app uses Electron's persistent browser profile, so `VerticalSpanishDB` IndexedDB data is stored by Electron.
- Tests set `VS_ELECTRON_USER_DATA_DIR` to isolate browser storage.
