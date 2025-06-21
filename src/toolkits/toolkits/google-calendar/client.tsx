import { GoogleCalendarTools } from "./tools";
import { createClientToolkit } from "@/toolkits/create-toolkit";
import { baseGoogleCalendarToolkitConfig } from "./base";
import {
  googleCalendarListCalendarsToolConfigClient,
  googleCalendarGetCalendarToolConfigClient,
  googleCalendarListEventsToolConfigClient,
  googleCalendarGetEventToolConfigClient,
  googleCalendarSearchEventsToolConfigClient,
  googleCalendarCreateEventToolConfigClient,
  googleCalendarFindAvailabilityToolConfigClient,
} from "./tools/client";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { SiGooglecalendar } from "@icons-pack/react-simple-icons";
import { ToolkitGroups } from "@/toolkits/types";
import { Toolkits } from "../shared";

const calendarScope = "https://www.googleapis.com/auth/calendar";

export const googleCalendarClientToolkit = createClientToolkit(
  baseGoogleCalendarToolkitConfig,
  {
    name: "Google Calendar",
    description: "Find availability and schedule meetings",
    icon: SiGooglecalendar,
    form: null,
    addToolkitWrapper: ({ children }) => {
      const { data: account, isLoading: isLoadingAccount } =
        api.accounts.getAccountByProvider.useQuery("google");

      const { data: hasAccess, isLoading: isLoadingAccess } =
        api.features.hasFeature.useQuery({
          feature: "google-calendar",
        });

      if (isLoadingAccount || isLoadingAccess) {
        return (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="bg-transparent"
          >
            <Loader2 className="size-4 animate-spin" />
          </Button>
        );
      }

      if (!hasAccess) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline">Private Beta</Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-center">
                We need to add you as a test user on Google Cloud for us to
                request sensitive OAuth scopes. <br />
                <br /> Please contact{" "}
                <Link
                  href="https://x.com/jsonhedman"
                  target="_blank"
                  className="underline"
                >
                  @jsonhedman
                </Link>{" "}
                on X to request access.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      if (!account) {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void signIn(
                "google",
                {
                  callbackUrl: `${window.location.href}?${Toolkits.GoogleCalendar}=true`,
                },
                {
                  prompt: "consent",
                  access_type: "offline",
                  response_type: "code",
                  include_granted_scopes: true,
                  scope: `openid email profile ${calendarScope}`,
                },
              );
            }}
            className="bg-transparent"
          >
            Connect
          </Button>
        );
      }

      if (!account?.scope?.includes(calendarScope)) {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void signIn(
                "google",
                {
                  callbackUrl: `${window.location.href}?${Toolkits.GoogleCalendar}=true`,
                },
                {
                  prompt: "consent",
                  access_type: "offline",
                  response_type: "code",
                  include_granted_scopes: true,
                  scope: `${account?.scope} ${calendarScope}`,
                },
              );
            }}
          >
            Grant Access
          </Button>
        );
      }

      return children;
    },
    type: ToolkitGroups.DataSource,
  },
  {
    [GoogleCalendarTools.ListCalendars]:
      googleCalendarListCalendarsToolConfigClient,
    [GoogleCalendarTools.GetCalendar]:
      googleCalendarGetCalendarToolConfigClient,
    [GoogleCalendarTools.ListEvents]: googleCalendarListEventsToolConfigClient,
    [GoogleCalendarTools.GetEvent]: googleCalendarGetEventToolConfigClient,
    [GoogleCalendarTools.SearchEvents]:
      googleCalendarSearchEventsToolConfigClient,
    [GoogleCalendarTools.CreateEvent]:
      googleCalendarCreateEventToolConfigClient,
    [GoogleCalendarTools.FindAvailability]:
      googleCalendarFindAvailabilityToolConfigClient,
  },
);
