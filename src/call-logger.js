/**
 * Call Logger — Saves and retrieves call logs
 *
 * Stores call data as JSON files in the logs/ directory.
 * Each call gets a unique ID based on timestamp + random string.
 */

const fs = require("fs");
const path = require("path");

const LOGS_DIR = process.env.VERCEL
  ? path.join("/tmp", "logs")
  : path.join(__dirname, "..", "logs");

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Generate unique call ID
 */
function generateCallId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `call_${timestamp}_${random}`;
}

/**
 * Save a call log to disk
 */
function saveCallLog(callData) {
  const callId = callData.id || generateCallId();
  const callPath = path.join(LOGS_DIR, `${callId}.json`);

  const logEntry = {
    id: callId,
    timestamp: new Date().toISOString(),
    ...callData,
  };

  fs.writeFileSync(callPath, JSON.stringify(logEntry, null, 2));
  console.log(`[call-logger] Saved call log: ${callId}`);

  return logEntry;
}

/**
 * Get all call logs (sorted by newest first)
 */
function getAllCalls() {
  if (!fs.existsSync(LOGS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(LOGS_DIR).filter((f) => f.endsWith(".json"));

  const calls = files
    .map((file) => {
      const filePath = path.join(LOGS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return data;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return calls;
}

/**
 * Get a specific call by ID
 */
function getCall(callId) {
  const callPath = path.join(LOGS_DIR, `${callId}.json`);

  if (!fs.existsSync(callPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(callPath, "utf8"));
}

/**
 * Update a call log (merge with existing data)
 */
function updateCallLog(callId, updates) {
  const existing = getCall(callId);

  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const callPath = path.join(LOGS_DIR, `${callId}.json`);
  fs.writeFileSync(callPath, JSON.stringify(updated, null, 2));
  console.log(`[call-logger] Updated call log: ${callId}`);

  return updated;
}

/**
 * Delete a call log
 */
function deleteCall(callId) {
  const callPath = path.join(LOGS_DIR, `${callId}.json`);

  if (fs.existsSync(callPath)) {
    fs.unlinkSync(callPath);
    console.log(`[call-logger] Deleted call log: ${callId}`);
    return true;
  }

  return false;
}

/**
 * Get call statistics
 */
function getCallStats() {
  const calls = getAllCalls();

  // Aggregate cost data
  const totalCost = calls.reduce((sum, c) => sum + (c.cost || 0), 0);
  const callsWithCost = calls.filter((c) => c.cost != null && c.cost > 0);
  const averageCostPerCall = callsWithCost.length > 0
    ? totalCost / callsWithCost.length
    : 0;

  // Aggregate per-provider costs from breakdowns
  const costByProvider = {};
  for (const c of calls) {
    if (c.costBreakdown && typeof c.costBreakdown === "object") {
      for (const [provider, amount] of Object.entries(c.costBreakdown)) {
        const val = typeof amount === "number" ? amount : parseFloat(amount) || 0;
        costByProvider[provider] = (costByProvider[provider] || 0) + val;
      }
    }
  }

  // Cost over time (per day)
  const costByDay = {};
  for (const c of calls) {
    if (c.cost && c.timestamp) {
      const day = c.timestamp.substring(0, 10); // YYYY-MM-DD
      costByDay[day] = (costByDay[day] || 0) + c.cost;
    }
  }

  const stats = {
    totalCalls: calls.length,
    completedCalls: calls.filter((c) => c.status === "completed").length,
    escalatedCalls: calls.filter((c) => c.status === "escalated").length,
    totalDuration: calls.reduce((sum, c) => sum + (c.duration || 0), 0),
    averageDuration:
      calls.length > 0
        ? Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length)
        : 0,
    urgencyCounts: {
      SPOED: calls.filter((c) => c.urgency === "SPOED").length,
      DRINGEND: calls.filter((c) => c.urgency === "DRINGEND").length,
      STANDAARD: calls.filter((c) => c.urgency === "STANDAARD").length,
      GEPLAND: calls.filter((c) => c.urgency === "GEPLAND").length,
    },
    totalCost,
    averageCostPerCall,
    costByProvider,
    costByDay,
  };

  return stats;
}

module.exports = {
  generateCallId,
  saveCallLog,
  getAllCalls,
  getCall,
  updateCallLog,
  deleteCall,
  getCallStats,
};
