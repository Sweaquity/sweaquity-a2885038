
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSearch } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasFilters,
  onClearFilters
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-lg border border-dashed">
      <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
      
      {hasFilters ? (
        <>
          <h3 className="text-lg font-medium">No matching opportunities</h3>
          <p className="text-muted-foreground text-center max-w-md mt-2 mb-4">
            We couldn't find any projects matching your current filters. Try adjusting your search criteria.
          </p>
          <Button onClick={onClearFilters} variant="outline">
            Clear Filters
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium">No opportunities available</h3>
          <p className="text-muted-foreground text-center max-w-md mt-2">
            There are currently no projects available for you to apply. Check back later for new opportunities.
          </p>
        </>
      )}
    </div>
  );
};
