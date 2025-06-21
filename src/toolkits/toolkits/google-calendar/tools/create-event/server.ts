import { type createEventTool } from "./base";
import { google } from "googleapis";
import type { ServerToolConfig } from "@/toolkits/types";
import type { calendar_v3 } from "googleapis";

export const googleCalendarCreateEventToolConfigServer = (
  accessToken: string,
): ServerToolConfig<
  typeof createEventTool.inputSchema.shape,
  typeof createEventTool.outputSchema.shape
> => {
  return {
    callback: async ({
      title,
      startDateTime,
      endDateTime,
    }) => {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: "v3", auth });

      console.log('[CreateEvent] Creating event with parameters:', {
        title,
        startDateTime,
        endDateTime
      });

      // Convert UTC times to Eastern Time
      const startDateET = new Date(startDateTime);
      const endDateET = new Date(endDateTime);
      
      // Format as RFC3339 with timezone
      const startDateTimeET = startDateET.toLocaleString('en-US', { 
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6-04:00');

      const endDateTimeET = endDateET.toLocaleString('en-US', { 
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6-04:00');

      console.log('[CreateEvent] Converted to Eastern Time:', {
        startDateTimeET,
        endDateTimeET
      });

      // Build the event object with simplified parameters
      const eventResource: calendar_v3.Schema$Event = {
        summary: title,
        start: {
          dateTime: startDateTimeET,
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: endDateTimeET,
          timeZone: 'America/New_York'
        },
      };

      console.log('[CreateEvent] Event resource:', eventResource);

      const response = await calendar.events.insert({
        calendarId: "primary", // Use primary calendar by default
        requestBody: eventResource,
        sendNotifications: true, // Send notifications to attendees
      });

      const event = response.data;

      console.log('[CreateEvent] Event created successfully:', {
        id: event.id,
        summary: event.summary,
        start: event.start?.dateTime,
        end: event.end?.dateTime,
        status: event.status,
        timeZone: event.start?.timeZone
      });

      return {
        id: event.id!,
        summary: event.summary ?? undefined,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        start: {
          dateTime: event.start?.dateTime ?? undefined,
          date: event.start?.date ?? undefined,
          timeZone: event.start?.timeZone ?? undefined,
        },
        end: {
          dateTime: event.end?.dateTime ?? undefined,
          date: event.end?.date ?? undefined,
          timeZone: event.end?.timeZone ?? undefined,
        },
        status: event.status ?? undefined,
        visibility: event.visibility ?? undefined,
        organizer: event.organizer
          ? {
              email: event.organizer.email ?? undefined,
              displayName: event.organizer.displayName ?? undefined,
            }
          : undefined,
        attendees: event.attendees?.map((attendee: calendar_v3.Schema$EventAttendee) => ({
          email: attendee.email ?? undefined,
          displayName: attendee.displayName ?? undefined,
          responseStatus: attendee.responseStatus ?? undefined,
          optional: attendee.optional ?? undefined,
        })),
        htmlLink: event.htmlLink ?? undefined,
        created: event.created ?? undefined,
        updated: event.updated ?? undefined,
      };
    },
  };
}; 