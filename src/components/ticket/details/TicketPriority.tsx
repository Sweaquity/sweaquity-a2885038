
import React from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface TicketPriorityProps {
  priority: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "low":
      return "bg-blue-100 text-blue-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "high":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const TicketPriority: React.FC<TicketPriorityProps> = ({ 
  priority, 
  disabled = false, 
  onChange 
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Priority</label>
      <Select
        value={priority}
        disabled={disabled}
        onValueChange={onChange}
      >
        <SelectTrigger className={getPriorityColor(priority)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
