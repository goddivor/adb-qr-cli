# adb-qr-cli

Connect Android devices to your PC wirelessly via ADB, straight from the terminal.

CLI port of the [ADB-QR VSCode extension](https://github.com/aakashpsindhi/ADB-QR).

## Requirements

- Node.js >= 18
- ADB version 32 or later, available in `PATH`
- Android 11+ phone with Developer Options enabled
- PC and phone on the **same Wi-Fi network** (mobile data turned off)

## Install

From source:

```bash
git clone <repo-url>
cd adb-qr-cli
npm install
npm link        # exposes the `adb-qr` binary globally
```

Or run directly without linking:

```bash
node dist/index.js <command>
```

## Usage

Three commands, one per pairing flow.

### `adb-qr qr`

Generates a QR code in the terminal that you scan from the phone.

```
On the phone:
  Settings > Developer Options > Wireless Debugging > Pair device with QR code
```

Scan the QR. The CLI will pair, then wait for the connection handshake and connect automatically.

### `adb-qr pair`

For phones where QR scanning isn't convenient. Scans the network, lists discovered devices, and asks for the 6-digit pairing code shown on the phone.

```
On the phone:
  Settings > Developer Options > Wireless Debugging > Pair device with pairing code
```

### `adb-qr connect`

For devices already paired with this PC in the past. Scans the LAN for `adb-tls-connect` services and connects to the first one found.

```
On the phone:
  Settings > Developer Options > Wireless Debugging  (just open the screen)
```

## How it works

- mDNS discovery via `bonjour-service` (service types `adb-tls-pairing` / `adb-tls-connect`).
- QR payload: `WIFI:T:ADB;S:ADBQR-connectPhoneOverWifi;P:<random>;;` rendered in ASCII via `qrcode-terminal`.
- ADB calls (`adb pair`, `adb connect`, `adb shell getprop`) shelled out via `child_process.spawnSync`.

Each scan has a 30-second timeout.

## Troubleshooting

**Pairing succeeds but the connect handshake never comes.**
Most often the phone has stopped advertising the `adb-tls-connect` service after a previous failed/interrupted session. Reset both sides:

```bash
adb kill-server && adb start-server
```

On the phone: toggle **Wireless Debugging OFF then ON** in Developer Options. Re-run `adb-qr qr`.

**`ADB is not installed or PATH is not configured`.**
Make sure `adb --version` works in the same shell. On Linux/macOS, `adb` ships with Android platform-tools.

**`ADB version XX is too old`.**
Wireless debugging needs platform-tools 32+. Update via your package manager or [download the latest platform-tools](https://developer.android.com/tools/releases/platform-tools).

**Nothing is found during scanning.**
Confirm the phone and PC are on the same Wi-Fi (not a guest network or an isolated SSID), and that mobile data is off on the phone.

## Project layout

```
src/
├── index.ts          # commander entrypoint
├── adb.ts            # adb command wrappers
├── mdns.ts           # bonjour scan helper
├── ui.ts             # logging + adb preflight
└── commands/
    ├── qr.ts
    ├── pair.ts
    └── connect.ts
```

## Scripts

```bash
npm run build    # tsc → dist/
npm run dev      # tsc --watch
npm start        # node dist/index.js
```

## License

MIT
