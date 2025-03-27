
import React from "react";
import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  searchTerm?: string;
}

export const EmptyState = ({ searchTerm }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      
      {searchTerm ? (
        <>
          <h3 className="text-lg font-medium">No results found</h3>
          <p className="text-muted-foreground mt-2">
            No matches found for "{searchTerm}". Try adjusting your search terms.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium">No opportunities available</h3>
          <p className="text-muted-foreground mt-2">
            There are currently no opportunities matching your criteria.
          </p>
        </>
      )}
    </div>
  );
};
