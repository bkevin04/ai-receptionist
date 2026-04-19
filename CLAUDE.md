# AI Receptionist for Plumbing Companies — Netherlands

## Project Overview

**Mission:** Validate and build an AI-powered receptionist that handles incoming calls and books appointments for plumbing companies in the Netherlands.

**Target Market:** Small-to-medium plumbing businesses (5–20 employees) in the Netherlands.

**Value Proposition:** Replace or complement human receptionists with a 24/7 AI agent that answers calls, captures job details, triages urgency, and books appointments — reducing missed calls (10–30% recovery), lowering overhead (~€1,500–2,500/month per company), and improving response time.

**Current Status:** Phase 1 (Discovery) in progress. Phase 2 (Build) ready to start once discovery succeeds.

---

## Phase 1: Customer Discovery (Current)

**Goal:** Validate that the problem exists and is worth solving. If discovery succeeds, begin building Phase 2.

### Hypothesis
Dutch plumbing companies lose 10–30% of incoming calls due to overwhelmed receptionists. Those missed calls represent lost revenue. An AI receptionist that picks up and books appointments would recover those calls and reduce overhead.

### Key Questions
1. Call volume: How many calls/day? How many are missed?
2. Impact: What revenue is lost per missed call?
3. Current tools: What systems do they use today (CRM, calendar, paper)?
4. Willingness: Would they pilot an AI solution?
5. Pricing: What's the monthly budget for a solution?
6. Integration: How easy/hard is it to connect to their existing systems?

### Validation Method
- Interview at least 10 Dutch plumbing companies (cold email + phone)
- Use the interview script below
- Track: company size, calls/day, missed calls/day, current tools, interest level, budget

### Success Criteria to Advance to Phase 2
✓ At least 10 companies interviewed  
✓ 70%+ confirm missed calls are a real pain point  
✓ Clear pattern emerges on tools they use (Google Calendar? Spreadsheet? Paper?)  
✓ At least 3 companies express interest in piloting (with or without payment)  
✓ Estimated market size and pricing ceiling identified  

**If criteria not met by [target date]:** Pivot or pause the project.

---

## Plumber Ticket Lifecycle

The typical end-to-end process when a plumber receives a service request:

### Step 1: Customer Initiates Contact
- Customer calls the plumbing company (primary channel)
- Alternative: email, website form, WhatsApp, or walk-in
- Common reasons: leaking pipe, clogged drain, boiler issue, bathroom renovation, emergency flooding

### Step 2: Receptionist Answers & Captures Details
- Greets the customer
- Captures: name, address, phone number, email
- Asks about the problem: what's wrong, how urgent, when did it start
- Notes: type of property (residential/commercial), access instructions

### Step 3: Triage & Urgency Classification
- **Emergency** (water flooding, gas leak) → same-day dispatch
- **Urgent** (no hot water, major leak) → next available slot
- **Standard** (dripping faucet, slow drain) → scheduled within days
- **Planned** (renovation, installation) → scheduled weeks out

### Step 4: Check Plumber Availability
- Receptionist checks the schedule/calendar
- Matches the job type with the right plumber (specialization, location, availability)
- Considers travel time between jobs

### Step 5: Book Appointment
- Proposes available time slots to the customer
- Confirms date, time, and expected duration
- May provide a cost estimate or hourly rate
- Books it in the system (calendar, spreadsheet, or CRM)

### Step 6: Confirmation & Reminder
- Sends appointment confirmation (SMS, email, or WhatsApp)
- Sends reminder 24h or morning-of before the appointment
- Customer can reschedule or cancel via phone

### Step 7: Dispatch & Job Execution
- Plumber receives job details (address, problem description, customer contact)
- Travels to location, diagnoses, and performs the work
- May need to order parts → follow-up visit scheduled

### Step 8: Post-Job Follow-Up
- Invoice sent to customer
- Payment collected
- Follow-up call/message for customer satisfaction
- Notes added to customer record for future reference

---

## What We'll Automate

**Receptionist job breakdown:** 80% repetitive information exchange, 20% judgment calls. AI handles the 80%, escalates the rest.

| Task | Impact | Automatable? |
|------|--------|--------------|
| Answering phones 24/7 | Recovers missed calls | ✓ |
| Capturing name, address, phone | Structured data entry | ✓ |
| Asking about the problem | Consistent, complete information | ✓ |
| Checking calendar and proposing slots | Eliminates back-and-forth | ✓ |
| Booking appointments | No double-bookings, no data entry errors | ✓ |
| Sending confirmations (SMS/email) | Automatic | ✓ |
| Triaging urgency (emergency → same day, standard → next week) | Smart routing | ✓ (with rules) |
| Escalating complex cases | Know when to transfer to human | ✓ (with thresholds) |

---

## Phase 2: Build (Starts after Discovery Success)

**Goal:** Build the MVP. Test with real users. Prove the core loop works.

### MVP Scope (Level 1 — Call Answering + Information Capture)
The AI should:
- Answer the phone in Dutch within 1 ring
- Greet professionally and ask about the problem
- Capture: customer name, address, phone, problem description, urgency
- Confirm details back to the customer
- Create a structured ticket and forward to the plumber via SMS/email
- Gracefully escalate to a human if needed (angry customer, non-plumbing request, etc.)

**Success metrics:**
- Call pickup rate: 100% (no missed calls)
- Information capture: 95%+ complete (all required fields)
- Customer satisfaction: 4+/5 (from follow-up survey)
- Human escalation rate: <15% (most calls handled end-to-end)
- Average call duration: <3 minutes

### Future Levels (Post-MVP)
- **Level 2:** Real-time calendar integration + automated scheduling
- **Level 3:** Urgency-based routing to on-call plumber
- **Level 4:** Post-job follow-up and satisfaction tracking
- **Level 5:** Full operation analytics and customer insights

---

## System Prompt & Conversation Design

### Design Principles
1. **Natural Dutch** — Sound like a friendly, professional receptionist, not a bot
2. **Efficient** — Capture all required info in <3 minutes
3. **Empathetic** — Adjust tone: flooded basement (urgent) vs. slow drain (calm)
4. **Escalate gracefully** — Know when to transfer to a human

### System Prompt Template

```
[IDENTITY]
- Role: receptionist for [COMPANY], a plumbing company in [CITY], Netherlands
- Language: Dutch (primary); English if customer requests
- Tone: warm, professional, efficient
- You represent the company — be helpful and reassuring

[COMPANY CONTEXT]
- Services offered: [list what you fix]
- Service area: [geographic coverage]
- Business hours: [normal hours; mention what to do after hours]
- Emergency protocol: [gas leak → call 0800-0009; flood → same-day dispatch]
- Pricing: [hourly rate or "quote upon inspection"]

[YOUR JOB]
1. Greet warmly: "Goedemorgen, u spreekt met [name] van [COMPANY]. Waarmee kan ik u helpen?"
2. Listen: Let them explain the problem
3. Capture: name, address, phone, problem description
4. Triage: Is this emergency (today), urgent (next slot), or standard (days)?
5. Offer: Propose available time slots
6. Confirm: Repeat back all details
7. Close: "De afspraak staat in onze agenda. U krijgt een bevestiging per SMS/email."

[RULES]
- Never make up availability or pricing
- Confirm address & phone by repeating them back
- If unsure about urgency → escalate to human
- If customer is angry or situation is complex → transfer to human
- Gas leak/severe flooding → give emergency number, don't handle yourself
- Non-plumbing request → suggest they contact a different specialist

[EXAMPLES - what to say]
- Problem is vague: "Kunt u beschrijven wat er aan de hand is? Is het water, verwarming, of iets anders?"
- Emergency detected: "Ik begrijp dat dit dringend is. Ik behandel dit als spoedgeval."
- Proposing time: "Ik heb ruimte op woensdag 14:00 of donderdag 10:00. Welke tijd past beter?"
- At the end: "De afspraak is bevestigd voor [date] om [time]. Veel succes!"
```

### Edge Cases (in code comments)
- Gas leak → emergency dispatcher number
- Angry customer → acknowledge, empathize, escalate
- Non-plumbing → suggest alternative (electrician, etc.)
- Returning customer → recognize them, ask if it's the same issue
- Can't reach plumber in time → offer emergency protocol (out-of-hours, weekend)

### Iteration Loop (After MVP Launch)
1. Record all calls (with consent)
2. Review failures: missed info, wrong triage, unnatural phrasing
3. Update system prompt based on patterns
4. A/B test new versions with real calls
5. Build test cases from edge cases encountered

---

## Tech Stack & Architecture

### Decision Criteria
Choose technologies that:
1. **Support Dutch language natively** (speech recognition, LLM, voice)
2. **Have low latency** (call should feel natural, <500ms response)
3. **Are production-ready** (can scale, have uptime guarantees)
4. **Are affordable** (cost per call should be <€0.50)
5. **Integrate easily** (webhooks, APIs, no proprietary lock-in)

### Voice AI Platform — Vapi (DECIDED)
- **Why Vapi?** Native support for custom LLMs, low latency, Dutch phone numbers, webhook-based
- API Key: `VAPI_API_KEY` (from https://dashboard.vapi.ai)
- Creates an assistant (AI agent), assigns a Dutch phone number, receives call events via webhook

### Speech & LLM Stack
- **Transcriber:** Deepgram Nova-2 (Dutch language, <500ms latency)
- **LLM:** Claude 3.5 Sonnet via Vapi (strong Dutch, instruction following)
- **Text-to-Speech:** ElevenLabs Rachel (professional, warm female voice)

### Data & Integration
- **Customer data:** Store in a simple database (PostgreSQL or Firebase)
- **Calendar integration:** Google Calendar API (read plumber availability)
- **Notifications:** SMS via Vonage or Twilio; email via SendGrid
- **Call logs:** Save transcripts and metadata for training and debugging

### Project Structure
```
AI Receptionist/
├── .env                    # API keys (VAPI_API_KEY, GOOGLE_CALENDAR_API, etc.)
├── .env.example            # Template for developers
├── src/
│   ├── index.js            # Express server (webhook handler)
│   ├── vapi-assistant.js   # Vapi assistant config & system prompt
│   ├── functions.js        # Functions the AI can call (triage, book, escalate)
│   ├── database.js         # Customer & appointment storage
│   └── google-calendar.js  # Calendar integration
├── tests/                  # Unit tests for triage logic, scheduling
├── CLAUDE.md               # This file
└── README.md               # Setup & deployment instructions
```

### How the System Works
1. **Setup:** `npm run setup-assistant` creates the Vapi agent with the Dutch prompt
2. **Operation:** Vapi picks up incoming calls, runs the AI conversation, sends events to our webhook
3. **Webhook handler:** Receives events, parses the AI's responses, calls functions (database, calendar, SMS)
4. **Function calls:** AI can call `triage_urgency()`, `check_availability()`, `book_appointment()`, `escalate_to_human()`
5. **Response:** Vapi TTS speaks the response back to the customer

---

## Discovery Metrics & Interview Script

### Key Metrics to Track (per company)
| Metric | Target | Why |
|--------|--------|-----|
| Calls/day | 10–50 | Volume = pain point = opportunity |
| Missed calls/day | 2+ | Direct validation of the problem |
| Current tools | CRM/Calendar/Paper | Determines integration complexity |
| Receptionist cost/month | €1,200–3,000 | Price ceiling for our solution |
| Interest in pilot | Yes/No | Willingness to try |

### Interview Script (20 minutes, 10 questions)

**Opening:** "I'm researching how plumbing companies in the Netherlands handle customer calls. Do you have 20 minutes?"

1. **How many calls/day do you receive?** (Listen for: 15–50 is typical)

2. **How many of those do you miss or can't answer in time?** (Critical validation)

3. **Who answers the phone?** (Dedicated receptionist? Office manager? The plumber? Outsourced?)

4. **When you miss a call, what happens?** (Do they call a competitor? Leave voicemail?)

5. **How do you currently schedule appointments?** (Google Calendar? Spreadsheet? Paper? Commusoft? Jobber?)

6. **How long does it take to schedule one appointment?** (Minutes of back-and-forth?)

7. **What's your biggest frustration with handling calls?** (Listen for key pain point)

8. **Have you considered hiring another receptionist?** (If yes: Why didn't you? Cost? Hard to find?)

9. **Would you be open to an AI system that picks up calls, takes details, and books appointments?** (Gauge openness)

10. **If it worked, what would you pay per month?** (Budget/willingness-to-pay)

**Closing:** "Thank you. Would you be interested in piloting a solution once we build it?" (Record interest level)

---

## Project Roadmap

### Phase 1: Customer Discovery (Current)
**Timeline:** April–May 2026  
**Goal:** Interview 10 plumbing companies, validate demand, identify success criteria

- [ ] Email outreach to 50 plumbing companies
- [ ] Schedule and complete 10 interviews
- [ ] Analyze findings: pain points, tools, willingness, budget
- [ ] **Decision:** Does the problem exist? (70%+ pain point validation) → Proceed to Phase 2 or pivot

### Phase 2: Build MVP (If Phase 1 succeeds)
**Timeline:** June–July 2026  
**Goal:** Launch a working voice AI that answers calls and books appointments

- [ ] Set up Vapi account, get Dutch phone number
- [ ] Build system prompt and test with simulated calls
- [ ] Implement webhook handler and database (customer data, appointments)
- [ ] Integrate Google Calendar API (check plumber availability)
- [ ] Test MVP internally with 20 simulated calls
- [ ] Evaluate: Information capture rate, call duration, naturalness, escalation rate

**MVP Success Criteria:**
- ✓ 95%+ information capture (all required fields filled)
- ✓ <3 minute average call duration
- ✓ <15% escalation rate
- ✓ 4+/5 customer satisfaction in simulated tests

### Phase 3: Pilot (July–August 2026)
**Timeline:** 4 weeks  
**Goal:** Real-world test with 2–3 plumbing companies

- [ ] Recruit 2–3 partner plumbing companies (from Discovery interviews)
- [ ] Deploy MVP with their system (calendar integration, SMS/email setup)
- [ ] Monitor: call quality, customer experience, technical issues
- [ ] Weekly feedback calls
- [ ] Collect data: calls handled, appointments booked, customer feedback

**Pilot Success Criteria:**
- ✓ System handles 80%+ of calls end-to-end (no escalation)
- ✓ Customers successfully book appointments
- ✓ Partners report time savings and reduced missed calls
- ✓ At least 1 company interested in paid deployment

### Phase 4: Refine (August–September 2026)
- Iterate on prompts and logic based on pilot feedback
- Add Level 2 features (real-time scheduling, multi-language support)
- Prepare for launch

### Phase 5: Launch (October 2026)
- Go-to-market: pricing, sales process, support
- Expand to 5–10 customers
- Measure ROI for each customer

### Phase 6: Scale (2027)
- Expand to other trades (electricians, HVAC, etc.)
- Expand to other countries (Belgium, Germany)
- Build self-serve onboarding portal

---

## Key Decisions & Checkpoints

| Checkpoint | Trigger | Decision | If No | If Yes |
|-----------|---------|----------|-------|--------|
| **End of Discovery** | 10 interviews complete | Do 70%+ report missed calls as a pain point? | Pivot or pause project | Proceed to Build |
| **End of MVP Build** | System tested internally | Does MVP meet success criteria (95% capture, <3 min, <15% escalation)? | Refactor prompts, improve logic | Proceed to Pilot |
| **End of Pilot** | 4 weeks of real-world testing | Do 80%+ of calls complete end-to-end? Do partners report value? | Iterate on feedback, extend pilot | Proceed to Launch prep |
| **Before Launch** | Pilot feedback integrated | Is the system production-ready? Can we support customers? | Delay launch, add infrastructure | Launch to market |

---

## Running This Project

### Discovery Phase (You Are Here)
- **Output:** Interview notes, data spreadsheet, summary findings
- **Key task:** Complete 10 interviews and analyze
- **Success looks like:** Clear pattern: X calls/day, Y missed, pain is real, Z% interested
- **Next step:** Update this document with findings, reassess Phase 2 plan

### Build Phase (Starts after Discovery)
- **Output:** Working voice AI system deployed on Vapi
- **Key task:** Code the webhook handler, integrate calendar, test prompts
- **Success looks like:** AI answers, captures info, suggests times, books appointments
- **Next step:** Internal testing with simulated calls, measure success criteria

### Pilot Phase (Starts after Build)
- **Output:** Real-world validation, customer feedback, metrics
- **Key task:** Deploy with partners, monitor, iterate
- **Success looks like:** High call completion rate, partner satisfaction, clear value
- **Next step:** Prepare for launch (pricing, support, marketing)
