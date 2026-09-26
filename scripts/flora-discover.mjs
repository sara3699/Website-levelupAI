import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import FLORA from "@flora-ai/flora";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const client = new FLORA({ apiKey: process.env.FLORA_API_KEY });

const workspaces = await client.workspaces.list();
console.log("=== Workspaces ===");
console.log(JSON.stringify(workspaces, null, 2));

const projects = await client.projects.list({ workspace_id: process.env.FLORA_WORKSPACE_ID });
console.log("=== Projects ===");
console.log(JSON.stringify(projects, null, 2));

const videoModels = await client.models.list({ type: "video" });
console.log("=== Video models ===");
for (const model of videoModels.models) {
  console.log(`- ${model.model_id} (${model.name}, ${model.provider}) beta=${!!model.beta} credits=${model.estimated_credits} secs=${model.estimated_seconds}`);
  console.log(`  capabilities: ${model.capabilities.join(", ")}`);
  console.log(`  params: ${JSON.stringify(model.params)}`);
}
