import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import FLORA from "@flora-ai/flora";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const client = new FLORA({ apiKey: process.env.FLORA_API_KEY });

const HERO_PROMPT = `Cinematic luxury background footage, dark charcoal-black studio void with slow ambient gold and bronze light drifting through frame. Camera: slow, extremely subtle dolly-in, almost imperceptible, no cuts. A single soft volumetric gold light source pulses gently from the upper-left, casting warm champagne-colored glow and soft lens flares across fine floating dust particles and thin atmospheric haze. Surfaces suggest polished dark glass and brushed bronze catching the light with slow specular highlights sweeping across them. Mood: quiet, premium, high-end tech/architecture film opening, restrained and elegant, no text, no logos, no people, no fast motion. Color grade: deep near-black base (#07070a) with warm gold (#d4af6a) and champagne (#efe2c8) highlights only, cinematic contrast, subtle film grain. Shot on anamorphic lens, shallow depth of field, 24fps cinematic motion blur.`;

console.log("Prompt:\n", HERO_PROMPT, "\n");

const generation = await client.generations.create({
  workspace_id: process.env.FLORA_WORKSPACE_ID,
  project_id: process.env.FLORA_PROJECT_ID,
  type: "video",
  model: process.env.FLORA_VIDEO_MODEL,
  prompt: HERO_PROMPT,
  params: {
    duration: "10",
  },
});

console.log("=== Generation started ===");
console.log(JSON.stringify(generation, null, 2));

const runId = generation.run_id;
console.log(`\nPolling run_id=${runId} ...`);

let result;
const start = Date.now();
while (true) {
  await new Promise((r) => setTimeout(r, 8000));
  result = await client.generations.retrieve(runId);
  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log(`[${elapsed}s] status=${result.status} progress=${result.progress}`);
  if (result.status === "completed" || result.status === "failed") break;
}

console.log("\n=== Final result ===");
console.log(JSON.stringify(result, null, 2));

if (result.status === "completed") {
  const video = result.outputs?.find((o) => o.type === "videoUrl");
  console.log("\nVideo URL:", video?.url);
} else {
  console.log("\nFailed:", result.error_code, result.error_message);
}
