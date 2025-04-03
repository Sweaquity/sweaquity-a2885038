
import React from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface TicketStatusProps {
  status: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const statusOptions = [
  { value: "new", label: "New" },
  { value: "in-progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "closed", label: "Closed" },
];

export const getStatusColor = (status: string) => {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800";
    case "in-progress":
      return "bg-yellow-100 text-yellow-800";
    case "blocked":
      return "bg-red-100 text-red-800";
    case "review":
      return "bg-purple-100 text-purple-800";
    case "done":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const TicketStatus: React.FC<TicketStatusProps> = ({ 
  status, 
  disabled = false, 
  onChange 
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Status</label>
      <Select
        value={status}
        disabled={disabled}
        onValueChange={onChange}
      >
        <SelectTrigger className={getStatusColor(status)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
