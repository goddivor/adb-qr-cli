import { Bonjour, Service } from "bonjour-service";
import { isIP } from "net";
import { MdnsDevice } from "./adb";

export const MDNS_PAIRING_TYPE = "adb-tls-pairing";
export const MDNS_CONNECT_TYPE = "adb-tls-connect";

export interface ScanHandle {
  stop: () => void;
  done: Promise<void>;
}

function serviceToDevice(service: Service): MdnsDevice | null {
  if (!service.addresses || service.addresses.length === 0) return null;
  for (const addr of service.addresses) {
    if (isIP(addr) === 4) {
      return { name: service.name, ipAddress: addr, port: service.port };
    }
  }
  return null;
}

export function scan(
  type: string,
  onDevice: (device: MdnsDevice) => void,
  timeoutMs = 30000
): ScanHandle {
  const instance = new Bonjour();
  const scanner = instance.find({ type }, (service: Service) => {
    const device = serviceToDevice(service);
    if (device) onDevice(device);
  });

  let resolveDone!: () => void;
  const done = new Promise<void>((r) => {
    resolveDone = r;
  });

  let stopped = false;
  let timer: NodeJS.Timeout;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    scanner.stop();
    instance.destroy();
    resolveDone();
  };
  timer = setTimeout(stop, timeoutMs);

  return { stop, done };
}
