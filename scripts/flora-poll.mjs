import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import FLORA from "@flora-ai/flora";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const client = new FLORA({ apiKey: process.env.FLORA_API_KEY });

export async function pollUntilDone(runId, { label = runId } = {}) {
  const start = Date.now();
  let consecutiveFailures = 0;

  while (true) {
    await new Promise((r) => setTimeout(r, 8000));

    let result;
    try {
      result = await client.generations.retrieve(runId);
      consecutiveFailures = 0;
    } catch (err) {
      consecutiveFailures++;
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`  [${elapsed}s] [${label}] poll error (${consecutiveFailures}): ${err.message ?? err}`);
      if (consecutiveFailures >= 8) {
        throw new Error(`Gave up polling ${label} after ${consecutiveFailures} consecutive failures`);
      }
      await new Promise((r) => setTimeout(r, 4000 * consecutiveFailures));
      continue;
    }

    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`  [${elapsed}s] [${label}] status=${result.status} progress=${result.progress}`);
    if (result.status === "completed" || result.status === "failed") return result;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const runId = process.argv[2];
  if (!runId) {
    console.error("Usage: node flora-poll.mjs <run_id>");
    process.exit(1);
  }
  const result = await pollUntilDone(runId, { label: runId });
  console.log(JSON.stringify(result, null, 2));
}
