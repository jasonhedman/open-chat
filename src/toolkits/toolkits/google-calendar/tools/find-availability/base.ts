import { z } from "zod";
import { createBaseTool } from "@/toolkits/create-tool";

export const findAvailabilityTool = createBaseTool({
  description: "Find available time slots in a calendar by analyzing existing events. When looking for availability on a specific day, use the same date for both startDate and endDate.",
  inputSchema: z.object({
    startDate: z.string().describe("Start date to search (YYYY-MM-DD format). For single-day searches, use the same date as endDate."),
    endDate: z.string().describe("End date to search (YYYY-MM-DD format). For single-day searches, use the same date as startDate."),
    durationMinutes: z.number().describe("Meeting duration in minutes"),
    attendeeNames: z.array(z.string()).optional().describe("List of Notion workspace user names to check availability for"),
  }).required(),
  outputSchema: z.object({
    availableSlots: z.array(
      z.object({
        start: z.string().describe("Start time of available slot (RFC3339 timestamp)"),
        end: z.string().describe("End time of available slot (RFC3339 timestamp)"),
        duration: z.number().describe("Duration of the slot in minutes"),
        dayOfWeek: z.string().describe("Day of the week"),
        date: z.string().describe("Date in YYYY-MM-DD format"),
        timeRange: z.string().describe("Human-readable time range"),
      })
    ),
    totalSlotsFound: z.number().describe("Total number of available slots found"),
    searchPeriod: z.object({
      start: z.string().describe("Start of search period"),
      end: z.string().describe("End of search period"),
      duration: z.number().describe("Requested duration in minutes"),
    }),
    conflictingEvents: z.array(
      z.object({
        id: z.string(),
        summary: z.string().optional(),
        start: z.string(),
        end: z.string(),
      })
    ).describe("Events that are blocking availability during the search period"),
  }),
}); 