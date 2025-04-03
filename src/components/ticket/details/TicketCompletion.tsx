
import React from "react";
import { Input } from "@/components/ui/input";

interface TicketCompletionProps {
  percentage: number;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TicketCompletion: React.FC<TicketCompletionProps> = ({ 
  percentage, 
  disabled = false, 
  onChange 
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Completion</label>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          min="0"
          max="100"
          value={percentage}
          onChange={onChange}
          disabled={disabled}
          className="w-20"
        />
        <span>%</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
