import React from "react";
import type { LucideIcon } from "lucide-react";

interface ToolCallDisplayProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{value}</div>
      </div>
    </div>
  );
}; 