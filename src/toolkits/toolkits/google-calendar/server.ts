import { createServerToolkit } from "@/toolkits/create-toolkit";
import { baseGoogleCalendarToolkitConfig } from "./base";
import {
  googleCalendarListCalendarsToolConfigServer,
  googleCalendarGetCalendarToolConfigServer,
  googleCalendarListEventsToolConfigServer,
  googleCalendarGetEventToolConfigServer,
  googleCalendarSearchEventsToolConfigServer,
  googleCalendarCreateEventToolConfigServer,
  googleCalendarFindAvailabilityToolConfigServer,
} from "./tools/server";
import { GoogleCalendarTools } from "./tools";
import { api } from "@/trpc/server";
import { google } from "googleapis";
import { db } from "@/server/db";
import { Client } from "@notionhq/client";

// Utility function to refresh Google OAuth token
async function refreshGoogleToken(account: {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  providerAccountId: string;
}) {
  if (!account.refresh_token) {
    throw new Error("No refresh token available");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: account.refresh_token,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update the account with new tokens
    await db.account.update({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: account.providerAccountId,
        },
      },
      data: {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token ?? account.refresh_token,
        expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
        token_type: credentials.token_type,
      },
    });

    return credentials.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw new Error("Failed to refresh access token");
  }
}

// Utility function to get valid access token
async function getValidAccessToken(account: {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  providerAccountId: string;
}) {
  if (!account.access_token) {
    throw new Error("No access token available");
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = account.expires_at ?? 0;
  const isExpired = expiresAt - now < 300; // 5 minutes buffer

  if (isExpired) {
    return refreshGoogleToken(account);
  }

  return account.access_token;
}

export const googleCalendarToolkitServer = createServerToolkit(
  baseGoogleCalendarToolkitConfig,
  `You have access to the Google Calendar toolkit for comprehensive calendar management and scheduling. This toolkit provides:

- **List Calendars**: Get all available calendars for the user
- **Get Calendar**: Retrieve detailed information about a specific calendar
- **List Events**: Get events from a calendar within a date range
- **Get Event**: Retrieve detailed information about a specific event
- **Search Events**: Find events matching specific criteria across calendars
- **Create Event**: Create new calendar events with attendees, reminders, and full configuration
- **Find Availability**: Analyze calendar availability and suggest optimal meeting times

**Tool Sequencing Workflows:**
1. **Calendar Overview**: Start with List Calendars to see available calendars, then use Get Calendar for specific calendar details
2. **Event Management**: Use List Events to see upcoming events, then Get Event for detailed information about specific events
3. **Event Discovery**: Use Search Events to find events by keywords, participants, or topics across all calendars
4. **Schedule Analysis**: Combine List Events across multiple calendars to analyze scheduling patterns and availability
5. **Meeting Scheduling**: Use Find Availability to identify open time slots, then Create Event to schedule meetings with attendees
6. **Event Creation**: Create events with comprehensive details including attendees, location, reminders, and notifications

**Best Practices:**
- Always specify appropriate date ranges when listing events to avoid overwhelming results
- Use Search Events for finding specific meetings, appointments, or events by keywords
- When analyzing schedules, consider different calendar types (personal, work, shared calendars)
- Use Find Availability before creating events to ensure optimal scheduling
- When creating events, include all necessary details like attendees, location, and reminders
- Consider using appropriate visibility and transparency settings for different event types`,
  async () => {
    const account = await api.accounts.getAccountByProvider("google");
    const notionAccount = await api.accounts.getAccountByProvider("notion");

    if (!account) {
      throw new Error("No Google account found");
    }

    if (!notionAccount?.access_token) {
      throw new Error("No Notion account found or access token missing");
    }

    // Get a valid access token, refreshing if necessary
    const accessToken = await getValidAccessToken(account);

    if (!accessToken) {
      throw new Error("Failed to obtain valid access token");
    }

    // Create Notion client
    const notion = new Client({
      auth: notionAccount.access_token,
    });

    return {
      [GoogleCalendarTools.ListCalendars]:
        googleCalendarListCalendarsToolConfigServer(accessToken),
      [GoogleCalendarTools.GetCalendar]:
        googleCalendarGetCalendarToolConfigServer(accessToken),
      [GoogleCalendarTools.ListEvents]:
        googleCalendarListEventsToolConfigServer(accessToken),
      [GoogleCalendarTools.GetEvent]: googleCalendarGetEventToolConfigServer(
        accessToken,
      ),
      [GoogleCalendarTools.SearchEvents]:
        googleCalendarSearchEventsToolConfigServer(accessToken),
      [GoogleCalendarTools.CreateEvent]:
        googleCalendarCreateEventToolConfigServer(accessToken),
      [GoogleCalendarTools.FindAvailability]:
        googleCalendarFindAvailabilityToolConfigServer(accessToken, notion),
    };
  },
);
