/**
 * Google Calendar Integration for AI Receptionist
 *
 * Handles:
 * - Loading service account credentials
 * - Checking plumber availability
 * - Creating/booking appointments
 */

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// Load service account credentials
const CREDENTIALS_PATH = path.join(__dirname, "..", "google-credentials.json");

let calendarClient = null;

/**
 * Initialize the Google Calendar client
 */
async function initializeCalendar() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(
        `Credentials file not found at ${CREDENTIALS_PATH}. Please ensure google-credentials.json is in the project root.`
      );
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    calendarClient = google.calendar({ version: "v3", auth });
    console.log("[Google Calendar] ✓ Authenticated successfully");
    return true;
  } catch (error) {
    console.error("[Google Calendar] ✗ Authentication failed:", error.message);
    return false;
  }
}

/**
 * Get available time slots for a plumber in the next N days
 * @param {string} calendarId - Google Calendar ID (usually email)
 * @param {number} daysAhead - How many days to look ahead (default: 7)
 * @param {number} slotDurationMinutes - Appointment duration (default: 90)
 * @returns {Promise<Array>} Array of available slots
 */
async function getAvailableSlots(
  calendarId,
  daysAhead = 7,
  slotDurationMinutes = 90
) {
  if (!calendarClient) {
    await initializeCalendar();
  }

  try {
    const now = new Date();
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // Get events from calendar
    const response = await calendarClient.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    // Define business hours (Monday-Saturday, 08:00-17:00)
    const businessHours = {
      start: 8, // 08:00
      end: 17, // 17:00
      durationMinutes: slotDurationMinutes,
    };

    const availableSlots = [];

    // Iterate through each day
    for (let i = 0; i < daysAhead; i++) {
      const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);

      // Skip Sundays (day 0)
      if (checkDate.getDay() === 0) continue;

      // Get busy times for this day
      const dayStart = new Date(checkDate);
      dayStart.setHours(businessHours.start, 0, 0, 0);

      const dayEnd = new Date(checkDate);
      dayEnd.setHours(businessHours.end, 0, 0, 0);

      const dayEvents = events.filter((event) => {
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);
        return eventStart >= dayStart && eventStart < dayEnd;
      });

      // Generate possible slots during business hours
      for (
        let hour = businessHours.start;
        hour < businessHours.end;
        hour += 1
      ) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(checkDate);
          slotStart.setHours(hour, minute, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + businessHours.durationMinutes);

          // Skip if slot extends beyond business hours
          if (slotEnd.getHours() > businessHours.end) continue;

          // Check if slot conflicts with any event
          const isConflict = dayEvents.some((event) => {
            const eventStart = new Date(event.start.dateTime || event.start.date);
            const eventEnd = new Date(event.end.dateTime || event.end.date);
            return (
              (slotStart >= eventStart && slotStart < eventEnd) ||
              (slotEnd > eventStart && slotEnd <= eventEnd) ||
              (slotStart <= eventStart && slotEnd >= eventEnd)
            );
          });

          if (!isConflict) {
            availableSlots.push({
              date: slotStart.toLocaleDateString("nl-NL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }),
              time: slotStart.toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isoDateTime: slotStart.toISOString(),
            });
          }
        }
      }
    }

    return availableSlots.slice(0, 6); // Return top 6 slots
  } catch (error) {
    console.error("[Google Calendar] Error fetching availability:", error.message);
    return [];
  }
}

/**
 * Book an appointment on the calendar
 * @param {string} calendarId - Google Calendar ID
 * @param {object} appointmentDetails - { title, startDateTime, endDateTime, description, customerEmail, customerPhone }
 * @returns {Promise<object>} Booked event details or error
 */
async function bookAppointment(calendarId, appointmentDetails) {
  if (!calendarClient) {
    await initializeCalendar();
  }

  try {
    const {
      title,
      startDateTime,
      endDateTime,
      description,
      customerEmail,
      customerPhone,
    } = appointmentDetails;

    const event = {
      summary: title,
      description: description
        ? `${description}\n\nKlanttelefoon: ${customerPhone}`
        : `Klanttelefoon: ${customerPhone}`,
      start: {
        dateTime: startDateTime,
        timeZone: "Europe/Amsterdam",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "Europe/Amsterdam",
      },
      attendees: customerEmail ? [{ email: customerEmail }] : [],
    };

    const response = await calendarClient.events.insert({
      calendarId,
      resource: event,
    });

    console.log("[Google Calendar] ✓ Appointment booked:", response.data.id);

    return {
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink,
    };
  } catch (error) {
    console.error("[Google Calendar] Error booking appointment:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get calendar availability summary (convenience function)
 * Returns a formatted string of available slots for AI response
 */
async function getAvailabilitySummary(calendarId, daysAhead = 7) {
  const slots = await getAvailableSlots(calendarId, daysAhead);

  if (slots.length === 0) {
    return "Helaas zijn er momenteel geen beschikbare slots. Kunt u later terugebellen?";
  }

  // Group by date
  const slotsByDate = {};
  slots.forEach((slot) => {
    if (!slotsByDate[slot.date]) {
      slotsByDate[slot.date] = [];
    }
    slotsByDate[slot.date].push(slot.time);
  });

  // Format response
  const dateStrings = Object.entries(slotsByDate).map(
    ([date, times]) => `${date}: ${times.join(", ")}`
  );

  return `Beschikbare tijdslots: ${dateStrings.join("; ")}.`;
}

module.exports = {
  initializeCalendar,
  getAvailableSlots,
  bookAppointment,
  getAvailabilitySummary,
};
