/**
 * Company Profile: Nojus Plumbers
 *
 * This file defines all company-specific data used by the AI receptionist.
 * Phone number is intentionally omitted — Vapi provides the actual number.
 */

const COMPANY_PROFILE = {
  name: "Nojus Plumbers",
  tagline: "Fast, Fair, and Done Right — Since 2016",
  email: "info@nojusplumbers.nl",
  website: "www.nojusplumbers.nl",
  address: "Kerkstraat 42, 1621 AB Hoorn, North Holland, Netherlands",
  owner: "Nojus van der Berg",
  city: "Hoorn",
  operatingHours: {
    weekdays: "08:00 – 18:00",
    saturday: "09:00 – 14:00",
    sunday: "Closed",
    emergencyLine: "24/7 (extra charges apply)",
  },
  serviceArea: [
    "Hoorn",
    "Enkhuizen",
    "Medemblik",
    "Purmerend",
    "Alkmaar",
    "Greater West Friesland region",
  ],
  responseTime: {
    standard: "Same-day or next business day",
    emergency: "Within 60 minutes (24/7)",
  },
};

const SERVICES = [
  {
    category: "Emergency Services",
    items: [
      {
        name: "Burst Pipe Repair",
        price: "€149 call-out + €85/hr",
        estimatedDuration: "1–3 hours",
        notes: "After-hours surcharge: €50 flat fee between 18:00–08:00 and weekends.",
      },
      {
        name: "Blocked Drain (Emergency)",
        price: "€129 call-out + €75/hr",
        estimatedDuration: "1–2 hours",
        notes: "Includes basic camera inspection.",
      },
      {
        name: "Gas Leak Response",
        price: "€169 call-out + €95/hr",
        estimatedDuration: "1–4 hours",
        notes: "Always call 0800-9009 first. We handle the repair after isolation.",
      },
      {
        name: "Overflowing Toilet",
        price: "€99 call-out + €75/hr",
        estimatedDuration: "30 min – 1.5 hours",
        notes: "",
      },
    ],
  },
  {
    category: "General Plumbing",
    items: [
      { name: "Leaking Tap Repair", price: "€65 + parts", estimatedDuration: "30–60 min" },
      { name: "Toilet Installation", price: "€195 (labour) / €345–€495 (incl. toilet)", estimatedDuration: "1.5–2.5 hours" },
      { name: "Sink & Basin Installation", price: "€150–€250", estimatedDuration: "1–2 hours" },
      { name: "Radiator Installation", price: "€175–€350 per radiator", estimatedDuration: "1.5–3 hours" },
      { name: "Pipe Repair / Replacement", price: "€85/hr + parts", estimatedDuration: "1–4 hours" },
      { name: "Outdoor Tap Installation", price: "€125", estimatedDuration: "1 hour" },
    ],
  },
  {
    category: "Drain Services",
    items: [
      { name: "Drain Unblocking (Standard)", price: "€95–€145", estimatedDuration: "30 min – 1.5 hours" },
      { name: "CCTV Drain Survey", price: "€175 (up to 30m) / €250 (30m+)", estimatedDuration: "1–2 hours" },
      { name: "Drain Relining", price: "From €450 per section", estimatedDuration: "Half day", notes: "Requires CCTV survey first." },
    ],
  },
  {
    category: "Heating & Boiler Services",
    items: [
      { name: "Boiler Service (Annual)", price: "€89", estimatedDuration: "45–60 min" },
      { name: "Boiler Repair", price: "€75 diagnostic fee + €85/hr + parts", estimatedDuration: "1–3 hours", notes: "Diagnostic fee waived if you proceed with the repair." },
      { name: "Boiler Replacement", price: "From €1,450 (including boiler)", estimatedDuration: "1 full day" },
      { name: "Underfloor Heating Installation", price: "From €55/m²", estimatedDuration: "2–5 days" },
      { name: "Power Flush", price: "€295 (up to 8 radiators) + €25/extra radiator", estimatedDuration: "4–6 hours", notes: "Recommended if radiators have cold spots." },
    ],
  },
  {
    category: "Bathroom Renovation",
    items: [
      { name: "Full Bathroom Installation", price: "From €3,500 (labour) / €5,500–€12,000 (incl. materials)", estimatedDuration: "5–10 working days" },
      { name: "Shower Installation", price: "€350–€750 (labour only)", estimatedDuration: "1–2 days" },
      { name: "Bath Replacement", price: "€295–€500 (labour only)", estimatedDuration: "1 day" },
    ],
  },
];

const FAQS = [
  { q: "Do you give free quotes?", a: "Yes, for all jobs over €250. For smaller jobs we can usually give an accurate price over the phone." },
  { q: "Are you insured?", a: "Absolutely. We carry full liability insurance and all our engineers are certified." },
  { q: "Do you charge for call-outs?", a: "For standard appointments, no separate call-out fee. For emergencies, a call-out fee applies." },
  { q: "What boiler brands do you work with?", a: "We service and install Nefit, Intergas, Remeha, Vaillant, and most other major brands." },
  { q: "Can you work on weekends?", a: "We are open Saturdays 09:00–14:00. Sunday work is available for emergencies only at the after-hours rate." },
  { q: "Do you offer payment plans?", a: "Yes, for boiler installations and bathroom renovations over €2,000, we offer 0% interest payment plans over 6 or 12 months." },
];

module.exports = { COMPANY_PROFILE, SERVICES, FAQS };
