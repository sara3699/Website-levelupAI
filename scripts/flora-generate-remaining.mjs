import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import FLORA from "@flora-ai/flora";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const client = new FLORA({ apiKey: process.env.FLORA_API_KEY });

const CLIPS = [
  {
    key: "services-bg",
    outFile: "services-bg.mp4",
    prompt:
      "Cinematic dark luxury background footage, deep near-black void with a single slow-drifting soft champagne-white light beam sweeping diagonally across frame from right to left. Camera: fixed, no movement, no zoom. Fine atmospheric haze and slow floating dust particles catch the light. Surfaces suggest dark brushed metal and glass panels reflecting faint warm highlights. Mood: quiet, restrained, premium technology showcase, no text, no logos, no people, no fast motion, no bright flashes. Color grade: near-black base (#111116) with pale champagne (#efe2c8) and soft gold (#d4af6a) highlights only, cinematic contrast, subtle film grain, shallow depth of field, 24fps.",
  },
  {
    key: "product-commercial",
    outFile: "product-commercial.mp4",
    prompt:
      "Cinematic luxury product commercial, extreme close-up macro shot of a matte black cosmetic bottle with a glowing gold emblem label, resting on a dark reflective glass surface. Camera: slow orbiting dolly move around the product, smooth and continuous, no cuts. Warm gold rim lighting sweeps across the bottle's edges as the camera moves, soft bokeh highlights drift in the dark background. Mood: premium, high-end beauty/tech advertisement, elegant and minimal, no text, no logos, no people, no fast motion. Color grade: deep black background (#07070a) with gold (#d4af6a) and champagne (#efe2c8) highlights only, cinematic contrast, subtle film grain, shallow depth of field, anamorphic lens flare, 24fps.",
  },
  {
    key: "contact-bg",
    outFile: "contact-bg.mp4",
    prompt:
      "Cinematic dark luxury background footage, deep blue-black void with slow ambient bronze and gold light drifting upward like rising embers or soft particles. Camera: slow, extremely subtle upward drift, almost imperceptible, no cuts. Soft volumetric warm light glows gently from the lower frame, casting gold and bronze highlights across fine atmospheric haze. Mood: quiet, inviting, premium, a sense of forward momentum and possibility, no text, no logos, no people, no fast motion. Color grade: deep near-black base (#111116) with warm gold (#d4af6a) and bronze (#8a6a3f) highlights only, cinematic contrast, subtle film grain, shallow depth of field, 24fps.",
  },
];

async function pollUntilDone(runId) {
  let result;
  const start = Date.now();
  while (true) {
    await new Promise((r) => setTimeout(r, 8000));
    result = await client.generations.retrieve(runId);
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`  [${elapsed}s] status=${result.status} progress=${result.progress}`);
    if (result.status === "completed" || result.status === "failed") return result;
  }
}

for (const clip of CLIPS) {
  console.log(`\n=== Generating: ${clip.key} ===`);
  console.log("Prompt:", clip.prompt);

  const generation = await client.generations.create({
    workspace_id: process.env.FLORA_WORKSPACE_ID,
    project_id: process.env.FLORA_PROJECT_ID,
    type: "video",
    model: process.env.FLORA_VIDEO_MODEL,
    prompt: clip.prompt,
    params: { duration: "10" },
  });

  console.log(`run_id=${generation.run_id} charged_cost=${generation.charged_cost}`);

  const result = await pollUntilDone(generation.run_id);

  if (result.status === "completed") {
    const video = result.outputs?.find((o) => o.type === "videoUrl");
    console.log(`DONE: ${clip.key} -> ${video?.url}`);
    console.log(`FINAL_COST: ${result.charged_cost}`);
    console.log(`SAVE_AS: ${clip.outFile}`);
  } else {
    console.log(`FAILED: ${clip.key} -> ${result.error_code} ${result.error_message}`);
  }
}
