import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import FLORA from "@flora-ai/flora";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const client = new FLORA({ apiKey: process.env.FLORA_API_KEY });

const runId = process.argv[2];
if (!runId) {
  console.error("Usage: node flora-check-run.mjs <run_id>");
  process.exit(1);
}

const result = await client.generations.retrieve(runId);
console.log(JSON.stringify(result, null, 2));
