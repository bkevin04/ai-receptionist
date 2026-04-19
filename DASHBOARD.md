# Call Dashboard — Prototype Phase

## Overview

The dashboard is a **local web interface** for reviewing incoming call logs in real-time. Instead of console logs, you now have a beautiful, modern dashboard showing:

- 📊 **Real-time statistics** — total calls, average duration, completed vs. escalated
- 📋 **Call list** — sortable, filterable view of all incoming calls
- 🔍 **Call details** — full transcript, summary, urgency level, recording links
- 🔄 **Auto-refresh** — updates every 5 seconds to show new calls

## Accessing the Dashboard

1. **Open your browser** to: `http://localhost:3000/dashboard`
2. The dashboard auto-refreshes every 5 seconds
3. Click any call to view full details

## Features

### Statistics Card

Shows at a glance:
- **Total Calls** — all calls received
- **Avg Duration** — average call length in seconds
- **Completed** — calls that ended naturally
- **Escalated** — calls transferred to a human

### Call List

Each call shows:
- **Timestamp** — when the call came in
- **Summary** — AI's summary of the problem
- **Urgency Badge** — color-coded priority:
  - 🔴 **SPOED** (Emergency) — water flooding, gas leak
  - 🟠 **DRINGEND** (Urgent) — no hot water, major leak
  - 🔵 **STANDAARD** (Standard) — normal service requests
  - 🟣 **GEPLAND** (Planned) — future bookings, renovations
- **Phone Number** — customer's phone
- **Duration** — call length

### Call Details Modal

Click a call to view:
- Full metadata (ID, timestamp, status, duration)
- **Problem Summary** — what the AI captured
- **Full Transcript** — complete conversation between AI and customer
- **Recording Link** — listen to the actual call (if available)
- **Customer Phone** — for follow-up

## Data Storage

Call logs are stored as **JSON files** in the `logs/` directory:

```
logs/
├── call_1776604081848_2ze0pji.json
├── call_1776604081851_gtcy72k.json
└── call_1776604081852_rqasdgk.json
```

Each file contains:
```json
{
  "id": "call_1776604081848_2ze0pji",
  "timestamp": "2026-04-19T13:34:41.848Z",
  "vapiCallId": "call-xxx",
  "phoneNumber": "+31612345678",
  "customerPhoneNumber": "+31687654321",
  "duration": 145,
  "urgency": "DRINGEND",
  "status": "completed",
  "summary": "Geen warm water in appartement...",
  "transcript": "Klant: Goedemorgen...",
  "recordingUrl": "https://...",
  "endedReason": "customer_hangup"
}
```

## API Endpoints

You can also query the data programmatically:

### Get all calls with stats
```bash
curl http://localhost:3000/api/calls
```

Response:
```json
{
  "calls": [...],
  "stats": {
    "totalCalls": 3,
    "completedCalls": 3,
    "escalatedCalls": 0,
    "averageDuration": 146,
    "urgencyCounts": {
      "SPOED": 1,
      "DRINGEND": 1,
      "STANDAARD": 1,
      "GEPLAND": 0
    }
  }
}
```

### Get a specific call
```bash
curl http://localhost:3000/api/calls/{callId}
```

### Get just stats
```bash
curl http://localhost:3000/api/stats
```

## Webhook Integration

When a call ends, the Vapi webhook sends an `end-of-call-report` message. The server:

1. **Extracts the summary** — what the AI learned about the problem
2. **Auto-detects urgency** — scans the summary for keywords (spoed, direct, overstroom → SPOED)
3. **Saves to JSON** — stores in `logs/` directory
4. **Dashboard refreshes** — automatically shows the new call (every 5 seconds)

## Prototype Phase Notes

✓ **What works:**
- Call logging and retrieval
- Dashboard display and filtering
- Auto-refresh every 5 seconds
- Urgency classification from transcript keywords
- Full call transcript storage

❌ **TODO (Phase 2):**
- Export/download call logs as CSV
- Filter by date range, urgency level, phone number
- Search within transcripts
- Call recording playback (embedded audio player)
- Multi-user authentication
- Persistent database (SQLite or PostgreSQL)
- Integration with CRM for ticket creation

## Testing

Sample call logs have been created for testing. You can:

1. Visit `http://localhost:3000/dashboard` right now
2. See 3 sample calls with different urgency levels
3. Click each to view full details
4. Watch it auto-refresh

## Cleanup

To delete all call logs and start fresh:

```bash
rm -rf logs/
```

The dashboard will show "No calls yet" until new calls come in.

## Server Commands

```bash
# Start server with dashboard
npm start

# Stop server
# (Ctrl+C in terminal)

# Clear all logs and restart
rm -rf logs/ && npm start
```
