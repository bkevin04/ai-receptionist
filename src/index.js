/**
 * AI Receptionist — Webhook Server
 *
 * Handles Vapi call lifecycle events:
 *   - assistant-request: dynamically provide assistant config per call
 *   - function-call: handle tool/function calls during conversation
 *   - status-update: track call status changes
 *   - end-of-call-report: log call summaries
 *   - transcript: capture conversation transcripts
 *
 * Start with: npm start
 */

require("dotenv").config();
const express = require("express");
const path = require("path");
const { createAssistantConfig } = require("./assistant-config");
const {
  generateCallId,
  saveCallLog,
  getAllCalls,
  getCall,
  updateCallLog,
  getCallStats,
} = require("./call-logger");
const {
  initializeCalendar,
  getAvailableSlots,
  bookAppointment,
  getAvailabilitySummary,
} = require("./google-calendar");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = process.env.PORT || 3000;

// Active calls (tracks calls in progress)
const activeCalls = new Map();

// Voice setting (persisted in memory, applied to next call)
let currentVoice = {
  voiceId: "XrExE9yKIg1WjnnlVkGX", // Matilda — default
  stability: 0.55,
  similarityBoost: 0.75,
  style: 0.25,
};

// ---------- Health Check ----------

app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

// ---------- Dashboard Auth ----------

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "Myliunoju1+";

app.post("/api/auth", (req, res) => {
  const { password } = req.body;
  if (password === DASHBOARD_PASSWORD) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, error: "Wrong password" });
});

// ---------- Dashboard Routes ----------

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "dashboard.html"));
});

function requireAuth(req, res, next) {
  if (req.headers["x-auth"] === DASHBOARD_PASSWORD) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

app.get("/api/calls", requireAuth, (req, res) => {
  const calls = getAllCalls();
  const stats = getCallStats();
  res.json({ calls, stats });
});

app.get("/api/calls/:id", requireAuth, (req, res) => {
  const call = getCall(req.params.id);
  if (!call) {
    return res.status(404).json({ error: "Call not found" });
  }
  res.json(call);
});

app.get("/api/stats", requireAuth, (req, res) => {
  const stats = getCallStats();
  res.json(stats);
});

// ---------- Costs API ----------

app.get("/api/costs", requireAuth, (req, res) => {
  const calls = getAllCalls();
  const stats = getCallStats();

  // Per-call cost list (newest first, only calls that have cost data)
  const callCosts = calls.map((c) => ({
    id: c.id,
    timestamp: c.timestamp,
    duration: c.duration || 0,
    cost: c.cost ?? null,
    costBreakdown: c.costBreakdown ?? null,
    customerName: c.customerName || null,
    briefIssue: c.briefIssue || null,
  }));

  // Estimate costs for calls that don't have Vapi cost data
  // Typical per-minute rates (USD):
  const estimatedRates = {
    vapi: 0.05,       // Vapi platform fee ~$0.05/min
    deepgram: 0.0059, // Deepgram Nova-2 ~$0.0059/min
    openai: 0.03,     // GPT-4o ~$0.03/min (varies with tokens)
    elevenlabs: 0.30, // ElevenLabs ~$0.30/min (turbo v2.5)
    transport: 0.02,  // Twilio/telephony ~$0.02/min
  };
  const estimatedTotalPerMin = Object.values(estimatedRates).reduce((a, b) => a + b, 0);

  // For calls without cost data, estimate from duration
  let estimatedTotal = 0;
  for (const c of callCosts) {
    if (c.cost == null && c.duration > 0) {
      c.estimatedCost = parseFloat(((c.duration / 60) * estimatedTotalPerMin).toFixed(4));
      estimatedTotal += c.estimatedCost;
    }
  }

  res.json({
    summary: {
      totalCalls: stats.totalCalls,
      totalCost: stats.totalCost,
      averageCostPerCall: stats.averageCostPerCall,
      costByProvider: stats.costByProvider,
      costByDay: stats.costByDay,
      estimatedTotal,
      totalMinutes: parseFloat((stats.totalDuration / 60).toFixed(1)),
    },
    rates: estimatedRates,
    calls: callCosts,
  });
});

// ---------- Voice Settings API ----------

app.get("/api/voice", requireAuth, (req, res) => {
  res.json(currentVoice);
});

app.post("/api/voice", requireAuth, async (req, res) => {
  const { voiceId, stability, similarityBoost, style } = req.body;
  if (!voiceId) {
    return res.status(400).json({ error: "voiceId is required" });
  }
  currentVoice = {
    voiceId,
    stability: stability ?? 0.55,
    similarityBoost: similarityBoost ?? 0.75,
    style: style ?? 0.25,
  };
  console.log(`[voice] Updated voice to: ${voiceId} (stability=${currentVoice.stability}, style=${currentVoice.style})`);

  // Update the Vapi assistant directly so the next call uses the new voice
  const VAPI_API_KEY = process.env.VAPI_API_KEY;
  const ASSISTANT_ID = "4c976962-87f8-44f1-87c2-dfd4361463e5";

  if (VAPI_API_KEY && VAPI_API_KEY !== "your_vapi_api_key_here") {
    try {
      const vapiRes = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voice: {
            provider: "11labs",
            voiceId: currentVoice.voiceId,
            stability: currentVoice.stability,
            similarityBoost: currentVoice.similarityBoost,
            style: currentVoice.style,
            useSpeakerBoost: true,
          },
        }),
      });

      if (vapiRes.ok) {
        console.log(`[voice] Vapi assistant updated successfully`);
      } else {
        const err = await vapiRes.text();
        console.error(`[voice] Vapi update failed: ${err}`);
        return res.json({ success: false, error: "Failed to update Vapi assistant", voice: currentVoice });
      }
    } catch (err) {
      console.error(`[voice] Vapi update error: ${err.message}`);
      return res.json({ success: false, error: err.message, voice: currentVoice });
    }
  }

  res.json({ success: true, voice: currentVoice });
});

// ---------- Vapi Webhook Endpoint ----------

app.post("/api/webhook", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message in request body" });
  }

  const { type } = message;

  try {
    switch (type) {
      case "assistant-request":
        return handleAssistantRequest(message, res);

      case "function-call":
        return await handleFunctionCall(message, res);

      case "tool-calls":
        return await handleToolCalls(message, res);

      case "status-update":
        return handleStatusUpdate(message, res);

      case "end-of-call-report":
        return await handleEndOfCallReport(message, res);

      case "transcript":
        return handleTranscript(message, res);

      default:
        console.log(`[webhook] Unhandled message type: ${type}`);
        return res.status(200).json({});
    }
  } catch (error) {
    console.error(`[webhook] Unhandled error in ${type}:`, error.message);
    return res.status(200).json({
      result: "Er is een technisch probleem opgetreden. Probeert u het later nogmaals.",
    });
  }
});

// ---------- Handlers ----------

/**
 * assistant-request: Vapi asks for assistant configuration.
 * This lets you dynamically serve different configs per phone number or caller.
 */
function handleAssistantRequest(message, res) {
  console.log("[assistant-request] Providing assistant config");

  // Load company profile — swap this import to switch companies
  const nojusPlumbers = require("./companies/nojus-plumbers");
  const config = createAssistantConfig(nojusPlumbers);

  // Apply the currently selected voice
  config.voice = {
    provider: "11labs",
    voiceId: currentVoice.voiceId,
    stability: currentVoice.stability,
    similarityBoost: currentVoice.similarityBoost,
    style: currentVoice.style,
    useSpeakerBoost: true,
  };

  return res.json({ assistant: config });
}

/**
 * function-call: The AI triggered a function during conversation.
 * Use this for actions like checking calendar, creating tickets, etc.
 */
async function handleFunctionCall(message, res) {
  const { functionCall, call } = message;
  const fnName = functionCall?.name;
  const fnParams = functionCall?.parameters;
  const callId = call?.id;

  console.log(`[function-call] ${fnName}`, fnParams);

  // Track customer details from function calls for structured logging
  if (callId && fnParams) {
    if (!activeCalls.has(callId)) {
      activeCalls.set(callId, { vapiCallId: callId, startTime: new Date(), status: "in-progress", customerDetails: {} });
    }
    const callData = activeCalls.get(callId);
    if (!callData.customerDetails) callData.customerDetails = {};

    if (fnParams.customerName) callData.customerDetails.name = fnParams.customerName;
    if (fnParams.customerPhone) callData.customerDetails.phone = fnParams.customerPhone;
    if (fnParams.customerEmail) callData.customerDetails.email = fnParams.customerEmail;
    if (fnParams.customerAddress) callData.customerDetails.address = fnParams.customerAddress;
  }

  switch (fnName) {
    case "checkAvailability":
      return await handleCheckAvailability(fnParams, res);

    case "bookAppointment":
      return await handleBookAppointment(fnParams, res);

    case "escalateToHuman":
      return handleEscalateToHuman(fnParams, res);

    default:
      console.log(`[function-call] Unknown function: ${fnName}`);
      return res.json({
        result: "Deze functie is momenteel niet beschikbaar.",
      });
  }
}

/**
 * tool-calls: Vapi sends tool/function calls in this format.
 * Contains an array of toolCallList with { id, type, function: { name, arguments } }.
 * We process each tool call and return results keyed by tool call ID.
 */
async function handleToolCalls(message, res) {
  const toolCalls = message.toolCallList || [];
  const call = message.call;
  const callId = call?.id;

  console.log(`[tool-calls] Received ${toolCalls.length} tool call(s)`);

  const results = [];

  for (const toolCall of toolCalls) {
    const fnName = toolCall.function?.name;
    const fnParams = typeof toolCall.function?.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function?.arguments || {};

    console.log(`[tool-calls] Processing: ${fnName}`, fnParams);

    // Track customer details for structured logging
    if (callId && fnParams) {
      if (!activeCalls.has(callId)) {
        activeCalls.set(callId, { vapiCallId: callId, startTime: new Date(), status: "in-progress", customerDetails: {} });
      }
      const callData = activeCalls.get(callId);
      if (!callData.customerDetails) callData.customerDetails = {};

      if (fnParams.customerName) callData.customerDetails.name = fnParams.customerName;
      if (fnParams.customerPhone) callData.customerDetails.phone = fnParams.customerPhone;
      if (fnParams.customerEmail) callData.customerDetails.email = fnParams.customerEmail;
      if (fnParams.customerAddress) callData.customerDetails.address = fnParams.customerAddress;
    }

    let result;
    switch (fnName) {
      case "checkAvailability":
        result = await handleCheckAvailabilityDirect(fnParams);
        break;
      case "bookAppointment":
        result = await handleBookAppointmentDirect(fnParams);
        break;
      case "escalateToHuman":
        result = handleEscalateToHumanDirect(fnParams);
        break;
      default:
        console.log(`[tool-calls] Unknown function: ${fnName}`);
        result = "Deze functie is momenteel niet beschikbaar.";
        break;
    }

    results.push({
      toolCallId: toolCall.id,
      result: typeof result === "string" ? result : JSON.stringify(result),
    });
  }

  return res.json({ results });
}

/**
 * Direct handlers that return result strings (used by tool-calls handler).
 */
async function handleCheckAvailabilityDirect(params) {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      return "Helaas kan ik momenteel geen beschikbaarheid checken. Probeert u het later nogmaals.";
    }
    const daysAhead = params?.daysAhead || 7;
    return await getAvailabilitySummary(calendarId, daysAhead);
  } catch (error) {
    console.error("[checkAvailability] Error:", error.message);
    return "Helaas kan ik momenteel geen beschikbaarheid checken. Probeert u het later nogmaals.";
  }
}

async function handleBookAppointmentDirect(params) {
  try {
    const { customerName, customerPhone, customerEmail, customerAddress, problemDescription, appointmentDateTime } = params;

    if (!appointmentDateTime) {
      return "Helaas kon ik de afspraak niet inplannen. Geen datum/tijd gegeven.";
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      return "Helaas kon ik de afspraak niet inplannen. Probeert u het later nogmaals.";
    }

    let startDateTime = new Date(appointmentDateTime);

    // Safety: if the AI generated a date in the past, correct the year to the current year
    const now = new Date();
    if (startDateTime < now) {
      console.warn(`[bookAppointment] Date in the past detected: ${appointmentDateTime}. Correcting year to ${now.getFullYear()}.`);
      startDateTime.setFullYear(now.getFullYear());
      // If still in the past (e.g. earlier month), bump to next year
      if (startDateTime < now) {
        startDateTime.setFullYear(now.getFullYear() + 1);
      }
    }
    const endDateTime = new Date(startDateTime.getTime() + 90 * 60 * 1000);

    const appointmentDetails = {
      title: `Klant: ${customerName || "Onbekend"}`,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      description: [
        problemDescription || "Geen probleembeschrijving",
        customerAddress ? `Adres: ${customerAddress}` : null,
      ].filter(Boolean).join("\n"),
      customerEmail: customerEmail || null,
      customerPhone: customerPhone || "Onbekend",
    };

    const result = await bookAppointment(calendarId, appointmentDetails);

    if (result.success) {
      return `De afspraak is succesvol ingepland op ${startDateTime.toLocaleDateString("nl-NL")} om ${startDateTime.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}. De klant ontvangt een bevestiging per e-mail.`;
    } else {
      return `Helaas kon ik de afspraak niet inplannen: ${result.error}`;
    }
  } catch (error) {
    console.error("[bookAppointment] Error:", error.message);
    return "Helaas kon ik de afspraak niet inplannen. Probeert u het later nogmaals.";
  }
}

function handleEscalateToHumanDirect(params) {
  console.log("[escalateToHuman]", params);
  return "Er is momenteel geen medewerker beschikbaar om het gesprek over te nemen. Blijf in gesprek met de beller. Bied aan om een afspraak in te plannen of om de gegevens te noteren zodat een collega terugbelt. Hang NIET op.";
}

/**
 * Check plumber availability — integrated with Google Calendar.
 */
async function handleCheckAvailability(params, res) {
  console.log("[checkAvailability]", params);

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      console.warn("[checkAvailability] GOOGLE_CALENDAR_ID not set in .env");
      return res.json({
        result: "Helaas kan ik momenteel geen beschikbaarheid checken. Probeert u het later nogmaals.",
      });
    }

    const daysAhead = params?.daysAhead || 7;
    const summary = await getAvailabilitySummary(calendarId, daysAhead);

    return res.json({ result: summary });
  } catch (error) {
    console.error("[checkAvailability] Error:", error.message);
    return res.json({
      result: "Helaas kan ik momenteel geen beschikbaarheid checken. Probeert u het later nogmaals.",
    });
  }
}

/**
 * Book an appointment — integrated with Google Calendar.
 */
async function handleBookAppointment(params, res) {
  console.log("[bookAppointment]", params);

  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      problemDescription,
      appointmentDateTime,
    } = params;

    if (!appointmentDateTime) {
      return res.json({
        result: "Helaas kon ik de afspraak niet inplannen. Geen datum/tijd gegeven.",
      });
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      console.warn("[bookAppointment] GOOGLE_CALENDAR_ID not set in .env");
      return res.json({
        result: "Helaas kon ik de afspraak niet inplannen. Probeert u het later nogmaals.",
      });
    }

    // Parse the appointment datetime
    let startDateTime = new Date(appointmentDateTime);

    // Safety: if the AI generated a date in the past, correct the year
    const now = new Date();
    if (startDateTime < now) {
      console.warn(`[bookAppointment] Date in the past detected: ${appointmentDateTime}. Correcting year to ${now.getFullYear()}.`);
      startDateTime.setFullYear(now.getFullYear());
      if (startDateTime < now) {
        startDateTime.setFullYear(now.getFullYear() + 1);
      }
    }

    const endDateTime = new Date(startDateTime.getTime() + 90 * 60 * 1000); // 90-minute appointment

    const appointmentDetails = {
      title: `Klant: ${customerName || "Onbekend"}`,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      description: problemDescription || "Geen probleembeschrijving",
      customerEmail: customerEmail || null,
      customerPhone: customerPhone || "Onbekend",
    };

    const result = await bookAppointment(calendarId, appointmentDetails);

    if (result.success) {
      return res.json({
        result: `De afspraak is succesvol ingepland op ${startDateTime.toLocaleDateString("nl-NL")} om ${startDateTime.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}. De klant ontvangt een bevestiging per e-mail.`,
      });
    } else {
      return res.json({
        result: `Helaas kon ik de afspraak niet inplannen: ${result.error}`,
      });
    }
  } catch (error) {
    console.error("[bookAppointment] Error:", error.message);
    return res.json({
      result: "Helaas kon ik de afspraak niet inplannen. Probeert u het later nogmaals.",
    });
  }
}

/**
 * Escalate to human — forward the call or notify a human operator.
 * NOTE: Actual call forwarding is not yet implemented.
 * The response instructs the AI to stay on the line and offer alternatives
 * (book appointment or take details for callback) instead of hanging up.
 */
function handleEscalateToHuman(params, res) {
  console.log("[escalateToHuman]", params);

  // TODO: Trigger actual call forwarding or notification
  // For now, no human is available — tell the AI to offer alternatives
  return res.json({
    result:
      "Er is momenteel geen medewerker beschikbaar om het gesprek over te nemen. Blijf in gesprek met de beller. Bied aan om een afspraak in te plannen of om de gegevens te noteren zodat een collega terugbelt. Hang NIET op.",
  });
}

/**
 * status-update: Call status changed (ringing, in-progress, ended, etc.)
 */
function handleStatusUpdate(message, res) {
  const { status, call } = message;
  const callId = call?.id;

  console.log(`[status-update] ${status} (call: ${callId})`);

  // Track the call in memory
  if (callId) {
    if (!activeCalls.has(callId)) {
      activeCalls.set(callId, {
        vapiCallId: callId,
        startTime: new Date(),
        status,
      });
    } else {
      const callData = activeCalls.get(callId);
      callData.status = status;
    }
  }

  return res.json({});
}

/**
 * end-of-call-report: Call has ended — contains summary, duration, recording URL.
 */
function handleEndOfCallReport(message, res) {
  const {
    endedReason,
    transcript,
    summary,
    recordingUrl,
    duration,
    call,
    assistant,
    cost,
    costBreakdown,
  } = message;

  const callId = call?.id;
  const phoneNumber = call?.customer?.number || call?.phoneNumber?.number;

  console.log("[end-of-call-report]");
  console.log(`  Reason: ${endedReason}`);
  console.log(`  Duration: ${duration}s`);
  console.log(`  Summary: ${summary}`);
  if (recordingUrl) {
    console.log(`  Recording: ${recordingUrl}`);
  }

  // Extract urgency from transcript/summary
  const urgencyMap = {
    SPOED: ["spoed", "direct", "nu", "overstroom", "gaslucht", "gas"],
    DRINGEND: ["dringend", "urgent", "geen water", "geen warm water"],
    STANDAARD: ["standaard", "normaal", "volgende week"],
    GEPLAND: ["gepland", "planning", "renovatie"],
  };

  let urgency = "STANDAARD";
  const summaryLower = (summary || "").toLowerCase();
  for (const [level, keywords] of Object.entries(urgencyMap)) {
    if (keywords.some((k) => summaryLower.includes(k))) {
      urgency = level;
      break;
    }
  }

  // Extract structured customer details from data collected during function calls
  const callDetails = callId ? activeCalls.get(callId) : null;
  const customerDetails = callDetails?.customerDetails || {};

  // Build a brief issue description from the summary (first sentence or max 60 chars)
  const briefIssue = extractBriefIssue(summary);

  // Build structured summary line: Name | Phone | Email | Address | Issue
  const summaryLine = [
    customerDetails.name || "—",
    customerDetails.phone || phoneNumber || "—",
    customerDetails.email || "—",
    customerDetails.address || "—",
    briefIssue || "—",
  ].join(" | ");

  console.log(`  Summary line: ${summaryLine}`);

  // Extract cost data from the report
  // Vapi may provide cost as a top-level number or as a detailed breakdown
  const callCost = cost ?? call?.cost ?? null;
  const callCostBreakdown = costBreakdown ?? call?.costBreakdown ?? call?.costs ?? null;

  // Build a normalized cost object
  const costData = {};
  if (callCost != null) {
    costData.total = typeof callCost === "number" ? callCost : parseFloat(callCost) || 0;
  }
  if (callCostBreakdown) {
    // Vapi sends breakdown with keys like: transport, stt, llm, tts, vapi
    costData.breakdown = callCostBreakdown;
  }
  // Also check for per-component cost fields Vapi sometimes puts on the call object
  if (call?.costs) {
    costData.breakdown = costData.breakdown || call.costs;
  }

  if (callCost != null) {
    console.log(`  Cost: $${costData.total?.toFixed(4)}`);
  }

  // Save call log
  const callLogId = generateCallId();
  const callLog = saveCallLog({
    id: callLogId,
    vapiCallId: callId,
    phoneNumber,
    assistantId: assistant?.id,
    status: "completed",
    endedReason,
    duration,
    urgency,
    transcript,
    summary,
    summaryLine,
    customerName: customerDetails.name || null,
    customerPhone: customerDetails.phone || phoneNumber || null,
    customerEmail: customerDetails.email || null,
    customerAddress: customerDetails.address || null,
    briefIssue,
    recordingUrl,
    customerPhoneNumber: call?.phoneNumber?.number,
    cost: costData.total ?? null,
    costBreakdown: costData.breakdown ?? null,
  });

  console.log(`  Call saved with ID: ${callLogId}`);

  // TODO: Create ticket in CRM from call summary
  // TODO: Send notification to plumber with job details

  // Clean up from active calls
  if (callId) {
    activeCalls.delete(callId);
  }

  return res.json({});
}

/**
 * Extract a brief issue description from the call summary.
 * Returns a short phrase suitable for a subject line (max 60 chars).
 */
function extractBriefIssue(summary) {
  if (!summary) return null;

  // Take the first sentence or up to 60 characters
  const firstSentence = summary.split(/[.!?]/)[0].trim();
  if (firstSentence.length <= 60) return firstSentence;
  return firstSentence.substring(0, 57) + "...";
}

/**
 * transcript: Real-time transcript updates during the call.
 */
function handleTranscript(message, res) {
  const { transcript } = message;
  if (transcript) {
    console.log(`[transcript] ${transcript}`);
  }
  return res.json({});
}

// ---------- Start Server ----------

// When running locally (not on Vercel), start the server
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`\nAI Receptionist webhook server running on port ${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/`);
    console.log(`  Webhook URL:  http://localhost:${PORT}/api/webhook`);

    // Initialize Google Calendar
    console.log("\n[Initialization]");
    await initializeCalendar();

    console.log(
      `\nFor production, expose this URL via ngrok or deploy to a cloud provider.`
    );
    console.log(`Then set the Server URL in your Vapi assistant config.\n`);
  });
} else {
  // On Vercel, initialize calendar eagerly
  initializeCalendar().catch((err) =>
    console.error("[init] Calendar init failed:", err.message)
  );
}

module.exports = app;
