import React from "react";
import { type findAvailabilityTool } from "./base";
import type { ClientToolConfig } from "@/toolkits/types";
import { HStack, VStack } from "@/components/ui/stack";
import { ToolCallComponent } from "../../components/tool-call";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const googleCalendarFindAvailabilityToolConfigClient: ClientToolConfig<
  typeof findAvailabilityTool.inputSchema.shape,
  typeof findAvailabilityTool.outputSchema.shape
> = {
  CallComponent: ({ args }) => {
    const startDate = new Date(`${args.startDate}T00:00:00`).toLocaleDateString();
    const endDate = new Date(`${args.endDate}T00:00:00`).toLocaleDateString();
    const dateRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;

    return (
      <ToolCallComponent
        action="Finding Availability"
        primaryText={`${args.durationMinutes} minute slots`}
        secondaryText={`${dateRange} • Primary Calendar`}
      />
    );
  },
  ResultComponent: ({ result, append }) => {
    const { availableSlots, totalSlotsFound, searchPeriod, conflictingEvents } = result;

    const handleSlotSelect = (slot: typeof availableSlots[0]) => {
      append({
        role: "user",
        content: `I've selected the time slot on ${slot.dayOfWeek}, ${slot.date} from ${slot.timeRange}`
      });
    };

    // Group slots by day for better organization
    const slotsByDay = availableSlots.reduce((acc, slot) => {
      const dayKey = `${slot.dayOfWeek}, ${slot.date}`;
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(slot);
      return acc;
    }, {} as Record<string, typeof availableSlots>);

    if (availableSlots.length === 0) {
      return (
        <VStack className="items-start gap-3">
          <HStack className="items-center gap-2">
            <AlertCircle className="size-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">No Available Slots Found</span>
          </HStack>
          
          <p className="text-muted-foreground text-sm">
            No {searchPeriod.duration}-minute slots available in the specified time range.
          </p>

          {conflictingEvents.length > 0 && (
            <VStack className="w-full items-start gap-2">
              <h4 className="text-sm font-medium">Conflicting Events ({conflictingEvents.length})</h4>
              <div className="flex w-full flex-col gap-1">
                {conflictingEvents.slice(0, 3).map((event, index) => (
                  <Card key={index} className="border-l-4 border-l-primary/30 hover:border-l-primary/50 transition-colors">
                    <CardContent className="p-2">
                      <VStack className="items-start gap-0.5">
                        <div className="font-medium text-sm">{event.summary ?? "Untitled Event"}</div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
                        </div>
                      </VStack>
                    </CardContent>
                  </Card>
                ))}
                {conflictingEvents.length > 3 && (
                  <p className="text-muted-foreground text-xs">
                    ...and {conflictingEvents.length - 3} more events
                  </p>
                )}
              </div>
            </VStack>
          )}
        </VStack>
      );
    }

    return (
      <VStack className="items-start gap-4">
        <HStack className="items-center justify-between w-full">
          <HStack className="items-center gap-2">
            <CheckCircle className="size-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {totalSlotsFound} Available Slot{totalSlotsFound !== 1 ? 's' : ''} Found
            </span>
          </HStack>

          <HStack className="flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="size-3 mr-1" />
              {searchPeriod.duration} minutes each
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Calendar className="size-3 mr-1" />
              {new Date(searchPeriod.start).toLocaleDateString()} - {new Date(searchPeriod.end).toLocaleDateString()}
            </Badge>
          </HStack>
        </HStack>

        {/* Show slots grouped by day */}
        <VStack className="w-full items-start gap-6">
          {Object.entries(slotsByDay).map(([dayKey, daySlots]) => (
            <VStack key={dayKey} className="w-full items-start gap-4">
              <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {daySlots.map((slot, index) => (
                  <Card 
                    key={`${dayKey}-${index}`}
                    className="py-0 border-l-4 border-l-primary hover:border-l-primary/80 transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] group"
                    onClick={() => handleSlotSelect(slot)}
                  >
                    <CardContent className="p-3">
                      <div className="flex flex-col space-y-6">
                        {/* Header with Day and Date */}
                        <div className="text-left">
                          <div className="text-sm font-semibold text-foreground leading-none">
                            {slot.dayOfWeek}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 leading-none">
                            {new Date(slot.date).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        
                        {/* Time Display */}
                        <div className="flex-1 flex items-center justify-center py-2">
                          <div className="text-center">
                            <p className="text-xl font-bold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors duration-200">
                              {slot.timeRange}
                            </p>
                          </div>
                        </div>
                        
                        {/* Select Button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 font-medium py-3 dark:hover:bg-primary/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSlotSelect(slot);
                          }}
                        >
                          Select Time
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </VStack>
          ))}
        </VStack>

        {conflictingEvents.length > 0 && (
          <VStack className="w-full items-start gap-2 mt-2">
            <HStack className="items-center gap-2">
              <AlertCircle className="size-4 text-primary/70" />
              <h4 className="text-sm font-medium text-primary/80">
                Conflicting Events ({conflictingEvents.length})
              </h4>
            </HStack>
            <div className="grid w-full gap-2 sm:grid-cols-2">
              {conflictingEvents.slice(0, 2).map((event, index) => (
                <Card key={index} className="border-l-4 border-l-primary/30 hover:border-l-primary/50 transition-colors">
                  <CardContent className="p-2 py-0">
                    <VStack className="items-start gap-0.5">
                      <div className="font-medium text-sm">{event.summary ?? "Untitled Event"}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
                      </div>
                    </VStack>
                  </CardContent>
                </Card>
              ))}
              {conflictingEvents.length > 2 && (
                <p className="text-muted-foreground text-xs col-span-2">
                  ...and {conflictingEvents.length - 2} more events
                </p>
              )}
            </div>
          </VStack>
        )}
      </VStack>
    );
  },
}; 