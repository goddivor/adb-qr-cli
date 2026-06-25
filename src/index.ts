#!/usr/bin/env node
import { Command } from "commander";
import { connectWithPairedDevice } from "./commands/connect";
import { connectWithPairingCode } from "./commands/pair";
import { connectWithQr } from "./commands/qr";

const program = new Command();

program
  .name("adb-qr")
  .description("Connect Android devices to your PC wirelessly via ADB")
  .version("0.1.0");

program
  .command("qr")
  .description("Connect to an Android device by scanning a QR code")
  .action(async () => {
    await connectWithQr();
  });

program
  .command("pair")
  .description("Connect to an Android device using a 6-digit pairing code")
  .action(async () => {
    await connectWithPairingCode();
  });

program
  .command("connect")
  .description("Connect to an already paired Android device")
  .action(async () => {
    await connectWithPairedDevice();
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
