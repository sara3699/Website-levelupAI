import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import FLORA from "@flora-ai/flora";
import { pollUntilDone } from "./flora-poll.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const client = new FLORA({ apiKey: process.env.FLORA_API_KEY });

const CLIPS = [
  {
    key: "process-discover",
    prompt:
      "Cinematic dark luxury background footage representing discovery and exploration: a single warm gold beam of light slowly sweeps across a near-black void, gradually revealing the faint texture of a rough dark stone surface beneath it, like a form emerging from darkness. Camera: slow, fixed wide shot, no cuts, no zoom. Fine atmospheric haze drifts through the light beam. Mood: quiet, searching, the first moment of understanding something hidden, no text, no logos, no people, no fast motion, no bright flashes. Color grade: deep near-black base (#07070a) with warm gold (#d4af6a) and champagne (#efe2c8) highlights only, cinematic contrast, subtle film grain, shallow depth of field, 24fps.",
  },
  {
    key: "process-shape",
    prompt:
      "Cinematic dark luxury background footage representing shaping and planning: thin glowing gold lines slowly draw themselves across a near-black void, connecting point to point to form a simple geometric structure like an architectural blueprint coming together. Camera: slow, fixed wide shot, no cuts, no zoom. Each line ignites softly as it completes, casting a faint warm glow. Mood: precise, deliberate, structure emerging from intention, no text, no logos, no people, no fast motion, no bright flashes. Color grade: deep near-black base (#111116) with warm gold (#d4af6a) and bronze (#8a6a3f) highlights only, cinematic contrast, subtle film grain, shallow depth of field, 24fps.",
  },
  {
    key: "process-build",
    prompt:
      "Cinematic dark luxury background footage representing building and assembly: interlocking dark brushed-metal panels slide and click together piece by piece against a near-black background, thin gold seams igniting at each connection point like a machine coming alive. Camera: slow diagonal dolly-in, continuous, no cuts. Soft bokeh highlights drift in the dark background as pieces assemble. Mood: precise, industrious, quiet momentum of construction, no text, no logos, no people, no fast motion, no bright flashes. Color grade: deep black background (#07070a) with gold (#d4af6a) and bronze (#8a6a3f) highlights only, cinematic contrast, subtle film grain, anamorphic lens flare, 24fps.",
  },
  {
    key: "process-launch",
    prompt:
      "Cinematic dark luxury background footage representing launch and arrival: a single point of warm gold light at the base of frame slowly expands and rises upward through a near-black void like a controlled release of energy, leaving soft trailing streaks of light behind it. Camera: extremely slow upward tilt following the light, no cuts. Fine drifting particles catch the light as it ascends. Mood: aspirational, culminating, quiet triumph, no text, no logos, no people, no fast motion, no bright flashes. Color grade: deep blue-black base (#111116) with warm gold (#d4af6a) and champagne (#efe2c8) highlights only, cinematic contrast, subtle film grain, shallow depth of field, 24fps.",
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

async function download(url, destPath) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`download failed: ${res.status} ${res.statusText}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath));
}

const videosDir = path.join(__dirname, "..", "public", "videos");

for (const clip of CLIPS) {
  console.log(`\n=== Generating: ${clip.key} ===`);

  const generation = await createWithRetry(clip);
  console.log(`run_id=${generation.run_id} charged_cost=${generation.charged_cost}`);

  const result = await pollUntilDone(generation.run_id, { label: clip.key });

  if (result.status === "completed") {
    const video = result.outputs?.find((o) => o.type === "videoUrl");
    console.log(`DONE: ${clip.key} -> ${video?.url}`);
    console.log(`FINAL_COST: ${result.charged_cost}`);

    if (video?.url) {
      const destPath = path.join(videosDir, `${clip.key}.mp4`);
      console.log(`Downloading to ${destPath} ...`);
      await download(video.url, destPath);
      console.log(`Saved: ${destPath}`);
    }
  } else {
    console.log(`FAILED: ${clip.key} -> ${result.error_code} ${result.error_message}`);
  }
}
