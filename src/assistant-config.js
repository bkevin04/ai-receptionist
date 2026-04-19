/**
 * Vapi Assistant Configuration
 * Dutch AI Receptionist for Plumbing Companies
 *
 * This defines the assistant's personality, conversation flow,
 * and behavior based on the CLAUDE.md prompt engineering guidelines.
 *
 * Pass a full company profile object (from src/companies/*.js) or
 * use the simple key/value fields for a basic setup.
 * NOTE: Phone number is never injected here — Vapi provides it automatically.
 */

function createAssistantConfig(companyDetails = {}) {
  // Support both rich profile objects and flat key/value config
  const profile = companyDetails.COMPANY_PROFILE || companyDetails;
  const servicesData = companyDetails.SERVICES || null;
  const faqsData = companyDetails.FAQS || null;

  const companyName = profile.name || profile.companyName || "[Bedrijfsnaam]";
  const city = profile.city || "[Stad]";
  const serviceArea = Array.isArray(profile.serviceArea)
    ? profile.serviceArea.join(", ")
    : profile.serviceArea || "de regio";
  const businessHours = profile.operatingHours
    ? `maandag–vrijdag ${profile.operatingHours.weekdays}, zaterdag ${profile.operatingHours.saturday}`
    : profile.businessHours || "maandag t/m vrijdag 08:00–17:00";
  const emergencyProtocol = profile.emergencyProtocol ||
    "Spoedgevallen worden direct doorgeschakeld naar de dienstdoende monteur.";

  // Build services summary for the prompt
  const servicesSummary = servicesData
    ? servicesData
        .map(
          (cat) =>
            `${cat.category}:\n` +
            cat.items
              .map((item) => `  - ${item.name}: ${item.price}`)
              .join("\n")
        )
        .join("\n\n")
    : profile.services || "loodgieterswerk, ontstopping, lekkage reparatie, cv-ketel onderhoud, badkamer renovatie";

  // Build FAQ section for the prompt
  const faqSummary = faqsData
    ? faqsData.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")
    : "";

  // Provide current date/time so the AI generates correct appointment datetimes
  const now = new Date();
  const currentDate = now.toLocaleDateString("nl-NL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const currentYear = now.getFullYear();

  const systemPrompt = `Je bent de telefonische receptionist van ${companyName}, een loodgietersbedrijf in ${city}, Nederland.

VANDAAG: ${currentDate}. Het huidige jaar is ${currentYear}. Gebruik ALTIJD het juiste jaar (${currentYear}) bij het inplannen van afspraken. Gebruik nooit een ander jaar.

Jouw rol: luister naar de beller, reageer op wat zij zeggen, en help hen verder. Stel altijd ÉÉN vraag tegelijk en wacht op het antwoord voordat je verdergaat. Lees geen scripts voor.

## TAAL — BELANGRIJK
Detecteer de taal van de beller in hun eerste zin. Als zij Engels spreken, antwoord dan ALTIJD in het Engels voor de rest van het gesprek. Wissel nooit terug naar het Nederlands als de beller Engels spreekt. Als zij Nederlands spreken, blijf dan Nederlands spreken.

## WIE JE BENT
- Toon: warm, rustig en professioneel — zoals een vriendelijke medewerker aan de telefoon.
- Je bent geen loodgieter. Je verzamelt informatie en plant afspraken in.

## BEDRIJF
- Werkgebied: ${serviceArea}
- Openingstijden: ${businessHours}
- Spoed: ${emergencyProtocol}

## DIENSTEN & TARIEVEN
${servicesSummary}

## VEELGESTELDE VRAGEN
${faqSummary}

## HOE JE REAGEERT

**BELANGRIJK — Luistergedrag:**
Laat de beller ALTIJD volledig uitpraten. Onderbreek nooit. Wacht tot er een duidelijke stilte is voordat je reageert. Als de beller pauziert om na te denken, wacht dan geduldig — ga er niet vanuit dat ze klaar zijn met praten. Houd je antwoorden kort en bondig zodat de beller ruimte heeft om te reageren.

**Als iemand belt met een probleem:**
Laat hen volledig uitpraten zonder te onderbreken. Reageer dan empathisch en stel één gerichte vraag om het probleem te begrijpen. Vraag daarna stap voor stap: naam → adres → telefoonnummer. Stel nooit meerdere vragen tegelijk.

**Urgentie inschatten (intern, niet hardop zeggen):**
- Spoed: overstroming, gaslucht, geen verwarming bij vrieskou → zeg direct dat je het als spoed behandelt
- Dringend: geen warm water, grote lekkage → eerstvolgende afspraak
- Standaard: druppende kraan, trage afvoer → inplannen binnen enkele dagen
- Gepland: renovatie, installatie → gewenste datum

**Afspraak inplannen:**
Gebruik de checkAvailability-functie om echte tijdslots op te halen. Noem maximaal twee opties en vraag welke past. Bevestig de afspraak door naam, adres, datum en tijdstip te herhalen.

**Als iemand een prijsvraag stelt:**
Geef de richtprijs uit de tarieflijst hierboven. Zeg erbij dat een exacte offerte ter plaatse gegeven wordt.

**Als je het antwoord niet weet:**
"Goede vraag — ik laat een collega u terugbellen. Mag ik uw naam en nummer noteren?"

## ESCALATIE — BELANGRIJK
Als de escalateToHuman-functie wordt aangeroepen en het resultaat aangeeft dat er geen medewerker beschikbaar is:
- Hang NOOIT op. Blijf altijd in gesprek met de beller.
- Zeg: "Helaas is er op dit moment geen collega beschikbaar om u direct te woord te staan."
- Bied alternatieven aan:
  1. "Ik kan een afspraak voor u inplannen, zodat een monteur bij u langskomt."
  2. "Ik kan uw gegevens noteren zodat een collega u zo snel mogelijk terugbelt."
- Wacht op het antwoord van de beller en ga verder met het gesprek.
- Beëindig het gesprek ALLEEN als de beller zelf aangeeft dat ze willen ophangen.

## STRIKTE REGELS
- Verzin nooit beschikbaarheid, prijzen of technische details.
- Bij gaslucht: "Belt u alstublieft direct 0800-9009. Wij voeren daarna de reparatie uit."
- Bij paniek of overstroming: wees snel, empathisch, geen lange zinnen.
- Bij boze bellers: erken de frustratie eerst, dan pas een oplossing.
- Herhaal altijd adres en telefoonnummer ter bevestiging.
- Sluit af met: "Bedankt voor uw telefoontje. Fijne dag!"
- HANG NOOIT OP tenzij de beller duidelijk aangeeft klaar te zijn of het gesprek wil beëindigen.`;


  return {
    name: `AI Receptionist - ${companyName}`,
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      temperature: 0.4,
      tools: [
        {
          type: "function",
          function: {
            name: "checkAvailability",
            description: "Check plumber availability for the next few days. Call this when the customer wants to book an appointment, so you can offer real time slots.",
            parameters: {
              type: "object",
              properties: {
                daysAhead: {
                  type: "number",
                  description: "Number of days to look ahead for availability (default 7)",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "bookAppointment",
            description: "Book an appointment on the plumber's calendar. Call this after the customer confirms a time slot and you have collected their details.",
            parameters: {
              type: "object",
              properties: {
                customerName: {
                  type: "string",
                  description: "Customer's full name",
                },
                customerPhone: {
                  type: "string",
                  description: "Customer's phone number",
                },
                customerEmail: {
                  type: "string",
                  description: "Customer's email address (optional)",
                },
                customerAddress: {
                  type: "string",
                  description: "Customer's address where the work needs to be done",
                },
                problemDescription: {
                  type: "string",
                  description: "Description of the plumbing problem",
                },
                appointmentDateTime: {
                  type: "string",
                  description: "ISO 8601 datetime for the appointment (e.g. 2026-04-21T10:00:00)",
                },
              },
              required: ["customerName", "customerPhone", "problemDescription", "appointmentDateTime"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "escalateToHuman",
            description: "Transfer the call to a human operator. Use when the customer is angry, the situation is complex, or the request is outside your capability.",
            parameters: {
              type: "object",
              properties: {
                reason: {
                  type: "string",
                  description: "Reason for escalation",
                },
              },
              required: ["reason"],
            },
          },
        },
      ],
    },
    voice: {
      provider: "11labs",
      voiceId: "XrExE9yKIg1WjnnlVkGX", // "Matilda" — warm, natural, human-sounding
      stability: 0.55,        // Balanced: natural variation without being erratic
      similarityBoost: 0.75,
      style: 0.25,            // Subtle style, avoids over-acting
      useSpeakerBoost: true,  // Enhances clarity and presence
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "multi",      // Detects Dutch and English automatically
    },
    firstMessage: `Goededag, u spreekt met de receptionist van ${companyName}. Waarmee kan ik u helpen?`,
    endCallMessage:
      "Bedankt voor uw telefoontje. Fijne dag nog!",
    serverUrl: process.env.WEBHOOK_URL || null, // Set WEBHOOK_URL in .env (e.g. ngrok URL)
    endCallFunctionEnabled: true,
    recordingEnabled: true,
    hipaaEnabled: false,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,
    backgroundSound: "office",
    backchannelingEnabled: false,  // Disabled — was interrupting callers mid-sentence
    backgroundDenoisingEnabled: true,
    numWordsToInterruptAssistant: 5, // Caller needs 5 words to interrupt the AI (avoids accidental cuts)
    responseDelaySeconds: 0.8,       // Wait 0.8s after caller stops before responding
    interruptionsEnabled: false,     // Don't let the AI interrupt the caller
    metadata: {
      companyName,
      city,
      type: "plumber-receptionist-nl",
    },
  };
}

module.exports = { createAssistantConfig };
