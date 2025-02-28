
import { FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DefaultCVDisplayProps {
  displayUrl: string | null;
}

export const DefaultCVDisplay = ({ displayUrl }: DefaultCVDisplayProps) => {
  const viewCV = () => {
    if (!displayUrl) {
      toast.error("No CV available to view");
      return;
    }
    window.open(displayUrl, '_blank');
  };

  if (!displayUrl) {
    return null;
  }

  return (
    <div className="rounded-md border bg-muted/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileIcon className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium truncate max-w-[200px]">
            Default CV
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={viewCV}
        >
          View
        </Button>
      </div>
    </div>
  );
};
