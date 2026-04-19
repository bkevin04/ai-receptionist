/**
 * Setup Script — Updates the Vapi AI assistant
 *
 * Run with: npm run setup
 *
 * Updates the existing assistant with the latest config (prompt, tools, voice, server URL).
 * Uses the REST API directly since the SDK's update method has issues.
 *
 * Prerequisites:
 *   - VAPI_API_KEY set in your .env file
 *   - WEBHOOK_URL set in your .env file (ngrok URL for local dev)
 */

require("dotenv").config();
const { createAssistantConfig } = require("./assistant-config");
const nojusPlumbers = require("./companies/nojus-plumbers");

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = "4c976962-87f8-44f1-87c2-dfd4361463e5";

if (!VAPI_API_KEY || VAPI_API_KEY === "your_vapi_api_key_here") {
  console.error("Error: VAPI_API_KEY is not set in your .env file.");
  console.error("Get your API key from: https://dashboard.vapi.ai");
  process.exit(1);
}

if (!process.env.WEBHOOK_URL) {
  console.error("Error: WEBHOOK_URL is not set in your .env file.");
  console.error("Start ngrok first: ngrok http 3000");
  console.error("Then set WEBHOOK_URL=https://your-id.ngrok-free.app/api/webhook");
  process.exit(1);
}

async function setupAssistant() {
  const config = createAssistantConfig(nojusPlumbers);

  const updatePayload = {
    serverUrl: config.serverUrl,
    model: config.model,
    voice: config.voice,
    firstMessage: config.firstMessage,
    silenceTimeoutSeconds: config.silenceTimeoutSeconds,
    maxDurationSeconds: config.maxDurationSeconds,
    backchannelingEnabled: config.backchannelingEnabled,
    backgroundDenoisingEnabled: config.backgroundDenoisingEnabled,
    backgroundSound: config.backgroundSound,
  };

  console.log("Updating Vapi assistant...");
  console.log(`  ID: ${ASSISTANT_ID}`);
  console.log(`  Name: ${config.name}`);
  console.log(`  Model: ${config.model.model}`);
  console.log(`  Tools: ${config.model.tools.length} functions`);
  console.log(`  Server URL: ${config.serverUrl}`);
  console.log(`  Voice stability: ${config.voice.stability}`);

  try {
    const response = await fetch(
      `https://api.vapi.ai/assistant/${ASSISTANT_ID}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error, null, 2));
    }

    const assistant = await response.json();

    console.log("\nAssistant updated successfully!");
    console.log(`  ID: ${assistant.id}`);
    console.log(`  Server URL: ${assistant.serverUrl}`);
    console.log(`  Tools: ${assistant.model?.tools?.length || 0} functions`);
    assistant.model?.tools?.forEach((t) =>
      console.log(`    - ${t.function?.name}`)
    );
    console.log(`\nStart the webhook server: npm start`);
  } catch (error) {
    console.error("\nFailed to update assistant:");
    console.error(`  ${error.message}`);
    process.exit(1);
  }
}

setupAssistant();
