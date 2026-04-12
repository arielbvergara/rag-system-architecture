import { google, calendar_v3 } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { CalendarEvent } from "../types";

export class CalendarService {
  private calendar: calendar_v3.Calendar;

  constructor(auth: GoogleAuth) {
    this.calendar = google.calendar({ version: "v3", auth });
  }

  async listEvents(
    maxResults = 10,
    calendarId = "primary",
    timeMin?: string,
    timeMax?: string
  ): Promise<calendar_v3.Schema$Event[]> {
    const response = await this.calendar.events.list({
      calendarId,
      timeMin: timeMin ?? new Date().toISOString(),
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  }

  async createEvent(
    event: CalendarEvent,
    calendarId = "primary"
  ): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return response.data;
  }
}
