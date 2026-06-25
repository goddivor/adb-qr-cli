import chalk from "chalk";
import {
  isAdbInstalled as adbInstalled,
  getAdbMajorVersion,
} from "./adb";

export function info(msg: string): void {
  console.log(chalk.cyan("[adb-qr]"), msg);
}

export function success(msg: string): void {
  console.log(chalk.green("[adb-qr]"), msg);
}

export function warn(msg: string): void {
  console.warn(chalk.yellow("[adb-qr]"), msg);
}

export function error(msg: string): void {
  console.error(chalk.red("[adb-qr]"), msg);
}

export function checkAdb(): boolean {
  const installed = adbInstalled();
  if (!installed.ok) {
    error("ADB is not installed or PATH is not configured.");
    error(installed.reason);
    return false;
  }
  const major = getAdbMajorVersion();
  if (major === null) {
    error("Could not determine ADB version.");
    return false;
  }
  if (major < 32) {
    error(`ADB version ${major} is too old. Please update to version 32 or later.`);
    return false;
  }
  return true;
}
