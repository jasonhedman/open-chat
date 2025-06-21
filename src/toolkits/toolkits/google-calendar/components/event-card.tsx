import React from "react";
import { Badge } from "@/components/ui/badge";
import { HStack, VStack } from "@/components/ui/stack";
import { Clock, Users, ExternalLink, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EventCardProps {
  event: {
    id: string;
    summary?: string;
    description?: string;
    start: {
      dateTime: string;
    };
    end: {
      dateTime: string;
    };
    status?: string;
    organizer?: {
      email?: string;
      displayName?: string;
    };
    attendees?: {
      email?: string;
      displayName?: string;
    }[];
    htmlLink?: string;
  };
  showDetails?: boolean;
}

const formatDateTime = (dateTime: string): string => {
  return new Date(dateTime).toLocaleString();
};

const formatTime = (dateTime: string): string => {
  return new Date(dateTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  showDetails = false,
}) => {
  const startDate = formatDateTime(event.start.dateTime);
  const endDate = formatDateTime(event.end.dateTime);
  const startTime = formatTime(event.start.dateTime);
  const endTime = formatTime(event.end.dateTime);

  return (
    <VStack className="items-start border-b pb-2 last:border-b-0 last:pb-0">
      <HStack className="w-full items-start gap-2">
        <VStack className="flex-1 items-start gap-1">
          <HStack>
            <h3 className="text-primary font-medium">
              {event.summary ?? "Untitled Event"}
            </h3>
            <HStack className="flex-wrap items-center gap-x-1 text-xs">
              <Clock className="size-3" />
              <span>
                {startDate.split(" ")[0] === endDate.split(" ")[0]
                  ? `${startDate.split(" ")[0]} ${startTime} - ${endTime}`
                  : `${startDate} ${startTime} - ${endDate} ${endTime}`}
              </span>
            </HStack>
            {event.status && event.status !== "confirmed" && (
              <Badge variant="outline" className="text-xs">
                {event.status}
              </Badge>
            )}
          </HStack>

          {event.description && showDetails && (
            <p className="text-muted-foreground line-clamp-3 text-xs">
              {event.description}
            </p>
          )}
        </VStack>
      </HStack>

      {showDetails && (
        <HStack className="w-full flex-wrap gap-2">
          {event.organizer && (
            <HStack className="text-muted-foreground items-center gap-2 text-xs">
              <User className="size-3" />
              <span>
                Organized by{" "}
                {event.organizer.displayName ?? event.organizer.email}
              </span>
            </HStack>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <HStack className="text-muted-foreground gap-1 text-xs">
              <Users className="size-3" />
              <span>
                {event.attendees.length} attendee
                {event.attendees.length !== 1 ? "s" : ""}
              </span>
            </HStack>
          )}

          {event.htmlLink && (
            <Link href={event.htmlLink} target="_blank">
              <Button variant="outline" size="sm" className="text-xs">
                <ExternalLink className="size-3" />
                Open in Google Calendar
              </Button>
            </Link>
          )}
        </HStack>
      )}
    </VStack>
  );
};
