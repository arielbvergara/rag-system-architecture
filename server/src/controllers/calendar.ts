import { Request, Response } from "express";
import { googleAuth } from "../config/google";
import { config } from "../config";
import { CalendarService } from "../services/calendar";
import { EmailService } from "../services/email";
import { cache } from "../lib/cache";
import { ApiResponse, CalendarEvent } from "../types";

export async function listEvents(
  req: Request,
  res: Response<ApiResponse>
): Promise<void> {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 10;
    const timeMin = req.query.timeMin as string | undefined;
    const timeMax = req.query.timeMax as string | undefined;
    const cacheKey = `calendar:events:${maxResults}:${timeMin ?? ""}:${timeMax ?? ""}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const calendarService = new CalendarService(googleAuth);
    const events = await calendarService.listEvents(maxResults, config.google.calendarId, timeMin, timeMax);

    cache.set(cacheKey, events);
    res.json({ success: true, data: events });
  } catch (error: any) {
    console.error("Calendar listEvents error:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch calendar events" });
  }
}

export async function createEvent(
  req: Request,
  res: Response<ApiResponse>
): Promise<void> {
  try {
    const event: CalendarEvent = req.body;

    if (!event.summary || !event.start?.dateTime || !event.end?.dateTime) {
      res.status(400).json({ success: false, error: "summary, start.dateTime, and end.dateTime are required" });
      return;
    }

    const calendarService = new CalendarService(googleAuth);
    const created = await calendarService.createEvent(event, config.google.calendarId);

    // Invalidate cached event lists so the next GET reflects the new event
    cache.invalidatePrefix("calendar:events:");

    // Send confirmation emails to attendees (non-blocking)
    if (event.attendees?.length) {
      const emailService = new EmailService();
      const startTime = new Date(event.start.dateTime).toLocaleString();

      Promise.allSettled(
        event.attendees.map(({ email }) =>
          emailService.sendEmail({
            to: email,
            subject: `Appointment Confirmed: ${event.summary}`,
            body: `Your appointment "${event.summary}" has been scheduled for ${startTime}.\n\n${event.description ?? ""}`.trim(),
          })
        )
      ).catch((err) => console.error("Calendar confirmation email error:", err.message));
    }

    res.status(201).json({ success: true, data: created, message: "Event created successfully" });
  } catch (error: any) {
    console.error("Calendar createEvent error:", error.message);
    res.status(500).json({ success: false, error: "Failed to create calendar event" });
  }
}
