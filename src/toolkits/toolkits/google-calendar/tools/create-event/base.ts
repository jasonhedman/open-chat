import { z } from "zod";
import { createBaseTool } from "@/toolkits/create-tool";

export const createEventTool = createBaseTool({
  description: "Create a new event in a Google Calendar",
  inputSchema: z.object({
    title: z.string().describe("Event title"),
    startDateTime: z.string().describe("Start time (RFC3339 timestamp)"),
    endDateTime: z.string().describe("End time (RFC3339 timestamp)"),
  }).required(),
  outputSchema: z.object({
    id: z.string().describe("The created event ID"),
    summary: z.string().optional().describe("Event title"),
    description: z.string().optional().describe("Event description"),
    location: z.string().optional().describe("Event location"),
    start: z.object({
      dateTime: z.string().optional().describe("Start time as RFC3339 timestamp"),
      date: z.string().optional().describe("Start date (for all-day events)"),
      timeZone: z.string().optional().describe("Time zone"),
    }),
    end: z.object({
      dateTime: z.string().optional().describe("End time as RFC3339 timestamp"),
      date: z.string().optional().describe("End date (for all-day events)"),
      timeZone: z.string().optional().describe("Time zone"),
    }),
    status: z.string().optional().describe("Event status"),
    visibility: z.string().optional().describe("Event visibility"),
    organizer: z
      .object({
        email: z.string().optional(),
        displayName: z.string().optional(),
      })
      .optional(),
    attendees: z
      .array(
        z.object({
          email: z.string().optional(),
          displayName: z.string().optional(),
          responseStatus: z.string().optional(),
          optional: z.boolean().optional(),
        }),
      )
      .optional(),
    htmlLink: z.string().optional().describe("Link to the event in Google Calendar"),
    created: z.string().optional().describe("Event creation time"),
    updated: z.string().optional().describe("Last modification time"),
  }),
}); 