import { spawnSync } from "child_process";

export interface MdnsDevice {
  name: string;
  ipAddress: string;
  port: number;
}

export function executeCommand(command: string): [number, string, string] {
  try {
    const child = spawnSync(command, {
      encoding: "utf-8",
      timeout: 30000,
      shell: true,
    });
    return [child.status ?? 1, child.stdout ?? "", child.stderr ?? ""];
  } catch (e) {
    return [1, "", String(e)];
  }
}

export function isAdbInstalled(): { ok: true } | { ok: false; reason: string } {
  const [code, , stderr] = executeCommand("adb --version");
  if (code === 0) return { ok: true };
  return { ok: false, reason: stderr.trim() || "adb command not found" };
}

export function getAdbMajorVersion(): number | null {
  const [code, stdout] = executeCommand("adb --version");
  if (code !== 0) return null;
  const match = stdout.match(/Version\s+(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function adbPair(device: MdnsDevice, password: string): { ok: boolean; output: string } {
  const [code, stdout, stderr] = executeCommand(
    `adb pair ${device.ipAddress}:${device.port} ${password}`
  );
  return { ok: code === 0, output: (code === 0 ? stdout : stderr).trim() };
}

export function adbConnect(ip: string, port: number): { ok: boolean; output: string } {
  const [code, stdout, stderr] = executeCommand(`adb connect ${ip}:${port}`);
  return { ok: code === 0, output: (code === 0 ? stdout : stderr).trim() };
}

export function getDeviceName(ip: string, port: number): string | null {
  const [code, stdout] = executeCommand(
    `adb -s ${ip}:${port} shell getprop ro.product.model`
  );
  if (code !== 0) return null;
  const name = stdout.trim();
  return name.length > 0 ? name : null;
}
