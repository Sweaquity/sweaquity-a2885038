
import { Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export const EmptyState = ({ hasFilters, onClearFilters }: EmptyStateProps) => {
  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center justify-center text-center">
        <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Matching Opportunities</h3>
        <p className="text-muted-foreground mb-4">
          We couldn't find any opportunities matching your criteria. Try adjusting your search or check back later.
        </p>
        {hasFilters ? (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};
