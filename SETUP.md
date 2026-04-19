# Setup Complete ✓

## Assistant Created
- **Name:** AI Receptionist - Voorbeeld Loodgieters
- **ID:** `4c976962-87f8-44f1-87c2-dfd4361463e5`
- **Language:** Dutch (NL)
- **Model:** GPT-4o via Vapi
- **Transcriber:** Deepgram Nova-2
- **Voice:** ElevenLabs Rachel

## Next Steps

### 1. Start the Webhook Server (DONE)
The webhook server is running on `http://localhost:3000` to handle call events.

### 2. Assign a Phone Number
1. Go to https://dashboard.vapi.ai
2. Log in with your account
3. Click on the assistant you just created
4. Assign a Dutch phone number (e.g., +31...)
5. Save the phone number for testing

### 3. Configure Webhook URL (for production/cloud deployment)
When you deploy the webhook server to a public URL, update the Vapi dashboard:
1. Go to your assistant settings
2. Set the **Server URL** to your public webhook endpoint (e.g., `https://your-domain.com/api/webhook`)
3. Save

### 4. Test the System
- Call your assigned phone number
- The AI receptionist will answer in Dutch
- Say something like "Ik heb een lekkende kraan" (I have a leaking faucet)
- The AI will ask questions and capture your details

## Project Commands

```bash
# Start the webhook server
npm start

# Run setup again (to create a new assistant)
npm run setup

# Install dependencies
npm install
```

## File Structure
- `src/index.js` — Webhook server (handles call events)
- `src/assistant-config.js` — AI receptionist system prompt & config
- `src/setup-assistant.js` — One-time setup script
- `CLAUDE.md` — Project context and strategy
- `.env` — API keys (never commit)

## What Happens When a Call Comes In

1. Customer calls your assigned phone number
2. Vapi answers and streams the conversation to the AI
3. AI asks about the problem using the Dutch receptionist prompt
4. AI captures name, address, phone, problem details
5. AI triages urgency (SPOED/DRINGEND/STANDAARD)
6. AI creates a structured ticket and returns it via webhook
7. Call ends; webhook server logs the call report

## Current Limitations (TODOs)

- ❌ Calendar integration — currently returns mock availability
- ❌ CRM/Database — call reports are logged to console, not saved
- ❌ SMS/Email confirmations — not yet sending actual messages
- ❌ SMS reminders — not yet scheduling reminders

These will be implemented in Phase 2.
