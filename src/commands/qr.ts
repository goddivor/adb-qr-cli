import qrcodeTerminal from "qrcode-terminal";
import { adbConnect, adbPair, getDeviceName } from "../adb";
import { MDNS_CONNECT_TYPE, MDNS_PAIRING_TYPE, scan } from "../mdns";
import { checkAdb, error, info, success } from "../ui";

export async function connectWithQr(): Promise<void> {
  if (!checkAdb()) return;

  const password = String(Math.floor(Math.random() * 1_000_000) + 1);
  const payload = `WIFI:T:ADB;S:ADBQR-connectPhoneOverWifi;P:${password};;`;

  info("On your Android phone:");
  info("  Settings > Developer Options > Wireless Debugging > Pair device with QR code");
  info("Scan this QR code:");
  console.log();
  qrcodeTerminal.generate(payload, { small: true });

  info("Waiting for device to pair (30s timeout)...");

  let pairedDevice: { ip: string; port: number } | null = null;
  const pairingScan = scan(MDNS_PAIRING_TYPE, (device) => {
    if (pairedDevice) return;
    const result = adbPair(device, password);
    if (result.ok) {
      success(`Paired: ${result.output}`);
      pairedDevice = { ip: device.ipAddress, port: device.port };
      pairingScan.stop();
    } else {
      error(`Pairing failed: ${result.output}`);
    }
  });
  await pairingScan.done;

  if (!pairedDevice) {
    error("No device paired (timeout).");
    return;
  }

  info("Waiting for connect handshake (30s timeout)...");
  let connected = false;
  const connectScan = scan(MDNS_CONNECT_TYPE, (device) => {
    if (connected) return;
    const result = adbConnect(device.ipAddress, device.port);
    if (result.ok) {
      connected = true;
      success(result.output);
      const name = getDeviceName(device.ipAddress, device.port);
      if (name) success(`Connected to ${name}`);
      connectScan.stop();
    } else {
      error(`Connect failed: ${result.output}`);
    }
  });
  await connectScan.done;

  if (!connected) error("Failed to connect (timeout).");
}
