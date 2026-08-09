import { loadEnvFile, loadSettings } from "./config/load.js";
import { createPaperBroker } from "./broker/paper.js";
import { assertLiveAllowed, createCcxtBroker } from "./broker/ccxt-live.js";
import { runLoops } from "./app/runtime.js";
import { log } from "./ops/logger.js";
import { parseArgs } from "./ops/cli.js";

async function main() {
  loadEnvFile();
  const settings = loadSettings();
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode ?? settings.mode;
  log("info", "boot", { project: "blofin-day-trading-bot", venue: "blofin", mode, kind: "day" });

  if (mode === "live") {
    assertLiveAllowed(settings, args.confirmLive, "BLOFIN");
    const broker = createCcxtBroker(settings, "BLOFIN", "blofin");
    await runLoops(settings, broker, args.loops);
  } else {
    const broker = createPaperBroker(settings);
    await runLoops(settings, broker, args.loops);
  }
}

main().catch((err) => {
  log("error", "fatal", { err: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
