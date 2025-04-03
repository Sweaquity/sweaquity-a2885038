
import React from "react";

interface TicketDescriptionProps {
  description: string | null | undefined;
}

export const TicketDescription: React.FC<TicketDescriptionProps> = ({ description }) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Description</label>
      <div className="p-3 bg-gray-50 rounded-md border min-h-[100px] whitespace-pre-wrap">
        {description || "No description provided."}
      </div>
    </div>
  );
};
