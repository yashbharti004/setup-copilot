import { executePipeline } from "../lib/agent/pipeline.js";

async function main() {
  console.log("\n=======================================================");
  console.log("TESTING LIVE AUTONOMOUS PIPELINE ON: 'Spotify'");
  console.log("=======================================================\n");

  const guide = await executePipeline("Spotify", (event) => {
    console.log(`[${event.timestamp}] [${event.step.toUpperCase()}] ${event.title}`);
    if (event.detail) console.log(`   -> ${event.detail}`);
    if (event.source_urls && event.source_urls.length > 0) {
      console.log(`   -> Sources:`, event.source_urls.slice(0, 3));
    }
  });

  console.log("\n-------------------------------------------------------");
  console.log("SYNTHESIZED GUIDE RESULT:");
  console.log("-------------------------------------------------------");
  console.log("App Name:", guide.app.name);
  console.log("Docs URL:", guide.app.docs_url);
  console.log("Difficulty:", guide.difficulty, `(${guide.difficulty_score} pts)`);
  console.log("Auth URL:", guide.config_values.auth_url);
  console.log("Token URL:", guide.config_values.token_url);
  console.log("Scopes:", guide.scopes.map(s => s.scope));
  console.log("Setup Steps:", guide.path.length);
  console.log("Evidence items:", guide.evidence.length);
  console.log("Evidence sample:", guide.evidence[0]);
  console.log("-------------------------------------------------------\n");
}

main().catch(console.error);

