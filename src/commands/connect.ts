import { adbConnect, getDeviceName } from "../adb";
import { MDNS_CONNECT_TYPE, scan } from "../mdns";
import { checkAdb, error, info, success } from "../ui";

export async function connectWithPairedDevice(): Promise<void> {
  if (!checkAdb()) return;

  info("Scanning for already paired devices (30s)...");

  let connected = false;
  const scanner = scan(MDNS_CONNECT_TYPE, (device) => {
    if (connected) return;
    const result = adbConnect(device.ipAddress, device.port);
    if (result.ok) {
      connected = true;
      success(result.output);
      const name = getDeviceName(device.ipAddress, device.port);
      if (name) success(`Connected to ${name}`);
      scanner.stop();
    } else {
      error(`Connect failed for ${device.ipAddress}:${device.port}: ${result.output}`);
    }
  });
  await scanner.done;

  if (!connected) error("No device connected (timeout).");
}
