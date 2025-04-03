
import React from "react";
import { Input } from "@/components/ui/input";

interface TicketEstimatedHoursProps {
  hours: number;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TicketEstimatedHours: React.FC<TicketEstimatedHoursProps> = ({ 
  hours, 
  disabled = false, 
  onChange 
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Estimated Hours</label>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          min="0"
          step="0.5"
          value={hours}
          onChange={onChange}
          disabled={disabled}
          className="w-20"
        />
        <span>hrs</span>
      </div>
    </div>
  );
};
