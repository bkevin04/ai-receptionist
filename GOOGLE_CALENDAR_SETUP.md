# Google Calendar Integration Setup

Your AI Receptionist is now configured to automatically check availability and book appointments on Google Calendar.

## What Was Added

- ✅ `src/google-calendar.js` — Handles all Google Calendar operations
- ✅ Updated `src/index.js` — Now calls real calendar functions instead of mocks
- ✅ Updated `.env` and `.env.example` — Added `GOOGLE_CALENDAR_ID` configuration

## Final Configuration Steps

### 1. Place Your Credentials File

The JSON file you downloaded from Google Cloud should be saved as:

```
/Users/kevinbui/AI Receptionist/google-credentials.json
```

**Important:** This file contains sensitive credentials. **Never** commit it to Git. It's already in `.gitignore`.

### 2. Set Your Calendar ID

In `.env`, update this line with your Google Calendar email:

```env
GOOGLE_CALENDAR_ID=your-actual-email@gmail.com
```

**Where to find it:**
- Open Google Calendar (calendar.google.com)
- Click **Settings** → **Settings** (top right gear icon)
- Go to the **Calendars** tab
- Find your calendar, click it
- The **Calendar ID** is shown under "Integrate calendar"
- It usually looks like: `your-email@gmail.com` or `your-email+alias@gmail.com`

### 3. Test the Integration

Run your server:

```bash
npm start
```

You should see:

```
[Google Calendar] ✓ Authenticated successfully
```

If you see an error instead, check:
- ✓ `google-credentials.json` exists in the project root
- ✓ `GOOGLE_CALENDAR_ID` is correct in `.env`
- ✓ You shared the calendar with the service account email (from the JSON file)

## How It Works

1. **Check Availability** — When the AI asks "Wanneer past het u?", it calls Google Calendar to find open slots
2. **Book Appointment** — When a customer confirms a time, the AI creates an event on the calendar
3. **Confirmation** — The event includes customer name, phone, and problem description

## Function Reference

### `getAvailabilitySummary(calendarId, daysAhead)`
Returns a formatted string of available slots for the AI to speak to the customer.

**Example Response:**
```
Beschikbare tijdslots: maandag 10 april: 10:00, 14:00; dinsdag 11 april: 09:00, 13:00.
```

### `bookAppointment(calendarId, appointmentDetails)`
Creates a calendar event with:
- Customer name
- Problem description
- Phone number
- Start/end time
- Optional email (for calendar invitation)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Credentials file not found" | Ensure `google-credentials.json` is in the project root |
| "Authentication failed" | Verify the JSON file is valid and not corrupted |
| "Calendar not found" | Check `GOOGLE_CALENDAR_ID` is correct and shared with service account |
| No available slots showing | The plumber's calendar is fully booked, or no business hours configured |

## Next Steps

1. Test with simulated calls to ensure availability and booking work
2. Update your system prompt in `src/assistant-config.js` to mention calendar booking
3. Add SMS/email confirmations for customers (optional enhancement)
