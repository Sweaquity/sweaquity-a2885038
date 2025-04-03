
import React from "react";

export const EmptyTicketState: React.FC = () => {
  return (
    <div className="text-center py-12 border rounded-md bg-gray-50">
      <h3 className="font-medium text-lg">No tickets found</h3>
      <p className="text-muted-foreground mt-1">
        Try adjusting your search or filters to find what you're looking for.
      </p>
    </div>
  );
};
