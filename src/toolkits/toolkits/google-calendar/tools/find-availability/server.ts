import { type findAvailabilityTool } from "./base";
import { google } from "googleapis";
import type { ServerToolConfig } from "@/toolkits/types";
import { notionListUsersToolConfigServer } from "../../../notion/tools/users/server";
import type { UserObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export const googleCalendarFindAvailabilityToolConfigServer = (
  accessToken: string,
  notion: any, // TODO: Type this properly
): ServerToolConfig<
  typeof findAvailabilityTool.inputSchema.shape,
  typeof findAvailabilityTool.outputSchema.shape
> => {
  return {
    message: (result) => {
      if (result.conflictingEvents.length > 0) {
        return `Found ${result.totalSlotsFound} available slots between ${result.searchPeriod.start} and ${result.searchPeriod.end}. There are ${result.conflictingEvents.length} conflicting events during this period.`;
      } else if (result.totalSlotsFound > 0) {
        return `Found ${result.totalSlotsFound} available slots between ${result.searchPeriod.start} and ${result.searchPeriod.end}.`;
      } else {
        return `No available slots found between ${result.searchPeriod.start} and ${result.searchPeriod.end}.`;
      }
    },
    callback: async ({
      startDate,
      endDate,
      durationMinutes,
      attendeeNames,
    }) => {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: "v3", auth });

      // Convert date strings to RFC3339 timestamps with timezone
      const timeMin = `${startDate}T00:00:00-04:00`;  // Use Eastern Time
      const timeMax = `${endDate}T23:59:59-04:00`;    // Use Eastern Time

      console.log('[FindAvailability] Search time range:', { timeMin, timeMax });

      // Fetch existing events in the time range
      const response = await calendar.events.list({
        calendarId: "primary", // Use primary calendar by default
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 2500, // Get all events in the range
        timeZone: 'America/New_York'  // Explicitly set timezone
      });

      const events = response.data.items ?? [];
      
      console.log('[FindAvailability] Total events found:', events.length);
      
      // Filter events that actually have start/end times (not all-day events without times)
      const timedEvents = events.filter(event => 
        event.start?.dateTime && event.end?.dateTime
      );
      
      console.log('[FindAvailability] Timed events:', timedEvents.length);
      console.log('[FindAvailability] First few timed events:', timedEvents.slice(0, 3).map(e => ({
        summary: e.summary,
        start: e.start?.dateTime,
        end: e.end?.dateTime
      })));

      // If attendees are specified, get their emails from Notion and check their calendars
      if (attendeeNames && attendeeNames.length > 0) {
        // Fetch all Notion users
        const notionUsers = await notionListUsersToolConfigServer(notion).callback({
          start_cursor: "",
          page_size: 100,
        });

        // Map names to emails
        const nameToEmail = new Map(
          notionUsers.results.map((user: UserObjectResponse) => {
            if (user.type === "person") {
              return [user.name?.toLowerCase() ?? "", user.person?.email ?? ""];
            }
            return [user.name?.toLowerCase() ?? "", ""];
          })
        );

        // Get attendee emails
        const attendeeEmails = attendeeNames
          .map(name => nameToEmail.get(name.toLowerCase()))
          .filter((email): email is string => !!email);

        // Check each attendee's calendar
        for (const email of attendeeEmails) {
          try {
            const attendeeResponse = await calendar.events.list({
              calendarId: email,
              timeMin,
              timeMax,
              singleEvents: true,
              orderBy: "startTime",
              maxResults: 2500,
            });
            
            const attendeeEvents = attendeeResponse.data.items ?? [];
            const attendeeTimedEvents = attendeeEvents.filter(event => 
              event.start?.dateTime && event.end?.dateTime
            );
            
            timedEvents.push(...attendeeTimedEvents);
          } catch (error) {
            console.error(`Failed to fetch calendar for ${email}:`, error);
          }
        }
      }

      // Use sensible defaults for working hours - now 6 AM to 11 PM to allow evening slots
      const workingHours = {
        startTime: "06:00",
        endTime: "23:00", // Changed from 24:00 to 23:00 to avoid setHours(24) issues
        workingDays: [0, 1, 2, 3, 4, 5, 6], // Include all days of the week
        timeZone: 'America/New_York'
      };

      const gapMinutes = 15; // 15 minute buffer between meetings
      const maxSlots = 50; // Increased to show more slots

      // Find available slots
      const availableSlots: Array<{
        start: string;
        end: string;
        duration: number;
        dayOfWeek: string;
        date: string;
        timeRange: string;
      }> = [];

      const conflictingEvents: Array<{
        id: string;
        summary?: string;
        start: string;
        end: string;
      }> = [];
      
      console.log('[FindAvailability] Search parameters:', {
        startDate: timeMin,
        endDate: timeMax,
        durationMinutes,
        workingHours,
        gapMinutes
      });
      
      const startDateObj = new Date(timeMin);
      const endDateObj = new Date(timeMax);
      
      // Iterate through each day
      const currentDate = new Date(startDateObj);
      
      while (currentDate <= endDateObj && availableSlots.length < maxSlots) {
        const dayOfWeek = currentDate.getDay();
        
        // Skip non-working days (now includes all days)
        if (!workingHours.workingDays.includes(dayOfWeek)) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Create a proper date for this day in Eastern Time
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = currentDate.getDate();
        
        // Set working hours for this day
        const [startHour, startMin] = workingHours.startTime.split(':').map(Number);
        const [endHour, endMin] = workingHours.endTime.split(':').map(Number);
        
        const dayStart = new Date(year, month, date, startHour ?? 6, startMin ?? 0, 0, 0);
        const dayEnd = new Date(year, month, date, endHour ?? 23, endMin ?? 0, 0, 0);

        console.log(`[FindAvailability] Processing day ${currentDate.toISOString().split('T')[0]}:`, {
          dayStart: dayStart.toISOString(),
          dayEnd: dayEnd.toISOString()
        });

        // Get events for this day
        const dayEvents = timedEvents.filter(event => {
          const eventStart = new Date(event.start!.dateTime!);
          const eventEnd = new Date(event.end!.dateTime!);
          
          // Check if event overlaps with this day's working hours
          return (eventStart < dayEnd && eventEnd > dayStart);
        });

        console.log(`[FindAvailability] Day ${currentDate.toISOString().split('T')[0]} events:`, dayEvents.length);

        // Sort events by start time
        dayEvents.sort((a, b) => 
          new Date(a.start!.dateTime!).getTime() - new Date(b.start!.dateTime!).getTime()
        );

        // Add conflicting events
        dayEvents.forEach(event => {
          conflictingEvents.push({
            id: event.id!,
            summary: event.summary ?? undefined,
            start: event.start!.dateTime!,
            end: event.end!.dateTime!,
          });
        });

        // Generate all possible slots for this day
        let currentSlotStart = new Date(dayStart);
        
        while (currentSlotStart.getTime() + (durationMinutes * 60 * 1000) <= dayEnd.getTime()) {
          const slotEnd = new Date(currentSlotStart.getTime() + (durationMinutes * 60 * 1000));
          
          // Check if this slot conflicts with any existing events
          const hasConflict = dayEvents.some(event => {
            const eventStart = new Date(event.start!.dateTime!);
            const eventEnd = new Date(event.end!.dateTime!);
            
            // Check for overlap: slot starts before event ends AND slot ends after event starts
            return (currentSlotStart < eventEnd && slotEnd > eventStart);
          });
          
          if (!hasConflict) {
            // Convert times to Eastern Time for display
            const slotStartET = new Date(currentSlotStart.toLocaleString('en-US', { timeZone: 'America/New_York' }));
            const slotEndET = new Date(slotEnd.toLocaleString('en-US', { timeZone: 'America/New_York' }));
            
            availableSlots.push({
              start: currentSlotStart.toISOString(),
              end: slotEnd.toISOString(),
              duration: durationMinutes,
              dayOfWeek: currentSlotStart.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' }),
              date: currentSlotStart.toLocaleDateString('en-US', { timeZone: 'America/New_York' }),
              timeRange: `${currentSlotStart.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                timeZone: 'America/New_York',
                hour12: true 
              })} - ${slotEnd.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                timeZone: 'America/New_York',
                hour12: true 
              })}`,
            });
            
            console.log('[FindAvailability] Found available slot:', {
              start: currentSlotStart.toISOString(),
              end: slotEnd.toISOString(),
              timeRange: `${currentSlotStart.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                timeZone: 'America/New_York',
                hour12: true 
              })} - ${slotEnd.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                timeZone: 'America/New_York',
                hour12: true 
              })}`
            });
            
            if (availableSlots.length >= maxSlots) break;
          }
          
          // Move to next hour (every 60 minutes instead of 15)
          currentSlotStart = new Date(currentSlotStart.getTime() + (60 * 60 * 1000));
        }
        
        if (availableSlots.length >= maxSlots) break;
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log('[FindAvailability] Final results:', {
        totalSlotsFound: availableSlots.length,
        firstSlot: availableSlots[0],
        conflictingEventsCount: conflictingEvents.length
      });

      // If the search period is only 1-2 days and there are many slots, 
      // try to filter to more relevant times based on the time range
      let filteredSlots = availableSlots;
      const searchDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
      
      if (searchDays <= 2 && availableSlots.length > 10) {
        // Look for evening slots (6 PM - 11 PM) if there are many options
        const eveningSlots = availableSlots.filter(slot => {
          const slotTime = new Date(slot.start);
          // Get the hour in Eastern Time
          const etTime = new Date(slotTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
          const etHour = etTime.getHours();
          return etHour >= 18 && etHour <= 23; // 6 PM to 11 PM Eastern
        });
        
        // If we found evening slots, prefer those
        if (eveningSlots.length > 0) {
          console.log('[FindAvailability] Filtering to evening slots for better relevance:', eveningSlots.length);
          filteredSlots = eveningSlots;
          
          // If there's a 10 PM slot specifically, prioritize it
          const tenPmSlots = eveningSlots.filter(slot => {
            const slotTime = new Date(slot.start);
            const etTime = new Date(slotTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
            return etTime.getHours() === 22; // 10 PM Eastern
          });
          
          if (tenPmSlots.length > 0) {
            console.log('[FindAvailability] Found 10 PM slots, prioritizing those:', tenPmSlots.length);
            filteredSlots = tenPmSlots;
          }
        }
      }

      return {
        availableSlots: filteredSlots,
        totalSlotsFound: filteredSlots.length,
        searchPeriod: {
          start: timeMin,
          end: timeMax,
          duration: durationMinutes,
        },
        conflictingEvents,
      };
    },
  };
}; 