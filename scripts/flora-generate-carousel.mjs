import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import FLORA from "@flora-ai/flora";
import { pollUntilDone } from "./flora-poll.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const client = new FLORA({ apiKey: process.env.FLORA_API_KEY });

const CLIPS = [
  {
    key: "carousel-gold-macro",
    prompt:
      "Cinematic dark luxury background footage, slow-motion macro shot of liquid gold pigment swirling through near-black ink in a shallow glass vessel. Camera: fixed overhead angle, no movement, no zoom. Soft directional light rakes across the surface, catching fine ripples and slow-drifting metallic particles. Mood: quiet, tactile, premium abstract texture, no text, no logos, no people, no fast motion, no bright flashes. Color grade: near-black base (#07070a) with warm gold (#d4af6a) and bronze (#8a6a3f) highlights only, cinematic contrast, subtle film grain, shallow depth of field, 24fps.",
  },
  {
    key: "carousel-architectural",
    prompt:
      "Cinematic dark luxury interior footage, a minimalist dark room with a single shaft of warm champagne light falling across a polished dark stone floor. Camera: slow lateral tracking move left to right at floor level, smooth and continuous, no cuts. Fine atmospheric haze catches the light beam, soft shadows shift slowly as the camera moves. Mood: quiet, spacious, high-end architecture/interior film, restrained and elegant, no text, no logos, no people, no fast motion. Color grade: deep near-black base (#111116) with pale champagne (#efe2c8) and soft gold (#d4af6a) highlights only, cinematic contrast, subtle film grain, shallow depth of field, 24fps.",
  },
  {
    key: "carousel-circuit",
    prompt:
      "Cinematic dark luxury technology footage, extreme close-up of interlocking dark brushed-metal panels with thin glowing gold seams pulsing gently like a circuit coming alive. Camera: slow diagonal dolly-in, continuous, no cuts. Warm gold light travels along the seams as the camera moves closer, soft bokeh highlights drift in the dark background. Mood: precise, premium, quiet technological elegance, no text, no logos, no people, no fast motion, no bright flashes. Color grade: deep black background (#07070a) with gold (#d4af6a) and bronze (#8a6a3f) highlights only, cinematic contrast, subtle film grain, shallow depth of field, anamorphic lens flare, 24fps.",
  },
  {
    key: "carousel-skyline",
    prompt:
      "Cinematic dark luxury atmosphere footage, a distant soft-focus skyline silhouette at dusk beneath a near-black gradient sky, warm bronze light glowing along the horizon line. Camera: extremely slow, almost imperceptible upward tilt, no cuts. Fine drifting haze softens the horizon, subtle warm light flares gently near the base of frame. Mood: aspirational, quiet, premium, sense of scale and possibility, no text, no logos, no people, no fast motion. Color grade: deep blue-black base (#111116) with warm bronze (#8a6a3f) and gold (#d4af6a) highlights only, cinematic contrast, subtle film grain, shallow depth of field, 24fps.",
  },
];

async function createWithRetry(clip, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await client.generations.create({
        workspace_id: process.env.FLORA_WORKSPACE_ID,
        project_id: process.env.FLORA_PROJECT_ID,
        type: "video",
        model: process.env.FLORA_VIDEO_MODEL,
        prompt: clip.prompt,
        params: { duration: "10" },
      });
    } catch (err) {
      console.log(`  create() attempt ${i}/${attempts} failed: ${err.message ?? err}`);
      if (i === attempts) throw err;
      await new Promise((r) => setTimeout(r, 5000 * i));
    }
  }
}

for (const clip of CLIPS) {
  console.log(`\n=== Generating: ${clip.key} ===`);

  const generation = await createWithRetry(clip);
  console.log(`run_id=${generation.run_id} charged_cost=${generation.charged_cost}`);

  const result = await pollUntilDone(generation.run_id, { label: clip.key });

  if (result.status === "completed") {
    const video = result.outputs?.find((o) => o.type === "videoUrl");
    console.log(`DONE: ${clip.key} -> ${video?.url}`);
    console.log(`FINAL_COST: ${result.charged_cost}`);
  } else {
    console.log(`FAILED: ${clip.key} -> ${result.error_code} ${result.error_message}`);
  }
}
