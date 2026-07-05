# Vertical Spanish Electron

A small macOS Electron wrapper around `https://verticalspanish.com/`.

## Commands

```bash
npm install
npm run generate:icons
npm start
npm test
npm run make
```

`npm run make` creates unsigned macOS DMG and ZIP artifacts in `out/make`.

## Notes

- The website stays on `verticalspanish.com`; external HTTPS and mail links open in the default browser.
- The app uses Electron's persistent browser profile, so `VerticalSpanishDB` IndexedDB data is stored by Electron.
- Tests set `VS_ELECTRON_USER_DATA_DIR` to isolate browser storage.
