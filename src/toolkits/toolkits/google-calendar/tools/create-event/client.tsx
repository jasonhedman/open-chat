import React from "react";
import { type createEventTool } from "./base";
import type { ClientToolConfig } from "@/toolkits/types";
import { HStack, VStack } from "@/components/ui/stack";
import { EventCard } from "../../components/event-card";
import { ToolCallComponent } from "../../components/tool-call";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Calendar } from "lucide-react";

export const googleCalendarCreateEventToolConfigClient: ClientToolConfig<
  typeof createEventTool.inputSchema.shape,
  typeof createEventTool.outputSchema.shape
> = {
  CallComponent: ({ args, isPartial }) => {
    if (isPartial || !args.title || !args.startDateTime) {
      return (
        <ToolCallComponent
          action="Creating Event"
          primaryText="New Event"
          secondaryText="No time specified"
        />
      );
    }

    return (
      <ToolCallComponent
        action="Creating Event"
        primaryText={args.title}
        secondaryText={new Date(args.startDateTime).toLocaleString()}
      />
    );
  },
  ResultComponent: ({ result }) => {
    // Transform result to match EventCard requirements
    const eventForCard = {
      ...result,
      start: { dateTime: result.start.dateTime ?? result.start.date ?? new Date().toISOString() },
      end: { dateTime: result.end.dateTime ?? result.end.date ?? new Date().toISOString() }
    };

    return (
      <VStack className="items-start gap-3">
        <HStack className="items-center gap-2">
          <CheckCircle className="size-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Event Created Successfully</span>
        </HStack>

        <EventCard event={eventForCard} showDetails={true} />
        
        <HStack className="flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            <Calendar className="size-3 mr-1" />
            Event ID: {result.id}
          </Badge>
          
          {result.attendees && result.attendees.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Users className="size-3 mr-1" />
              {result.attendees.length} attendee{result.attendees.length !== 1 ? 's' : ''} invited
            </Badge>
          )}
          
          {result.status && (
            <Badge variant="secondary" className="text-xs">
              Status: {result.status}
            </Badge>
          )}
        </HStack>
      </VStack>
    );
  },
}; 