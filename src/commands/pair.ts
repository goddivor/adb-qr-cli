import { input, select } from "@inquirer/prompts";
import { adbConnect, adbPair, getDeviceName, MdnsDevice } from "../adb";
import { MDNS_CONNECT_TYPE, MDNS_PAIRING_TYPE, scan } from "../mdns";
import { checkAdb, error, info, success } from "../ui";

export async function connectWithPairingCode(): Promise<void> {
  if (!checkAdb()) return;

  info("On your Android phone:");
  info("  Settings > Developer Options > Wireless Debugging > Pair device with pairing code");
  info("Scanning for devices on the network (30s)...");

  const devices: MdnsDevice[] = [];
  const seen = new Set<string>();
  const scanner = scan(MDNS_PAIRING_TYPE, (device) => {
    const key = `${device.ipAddress}:${device.port}`;
    if (seen.has(key)) return;
    seen.add(key);
    devices.push(device);
    info(`Found: ${key}`);
  });

  await scanner.done;

  if (devices.length === 0) {
    error("No devices found.");
    return;
  }

  const choice = await select<MdnsDevice>({
    message: "Select a device",
    choices: devices.map((d) => ({
      name: `${d.ipAddress}:${d.port}`,
      value: d,
    })),
  });

  const code = await input({
    message: "Enter pairing code",
    validate: (v) => /^\d{6}$/.test(v) || "Code must be 6 digits",
  });

  const pairResult = adbPair(choice, code);
  if (!pairResult.ok) {
    error(`Pairing failed: ${pairResult.output}`);
    return;
  }
  success(`Paired: ${pairResult.output}`);

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
    }
  });
  await connectScan.done;

  if (!connected) error("Failed to connect (timeout).");
}
