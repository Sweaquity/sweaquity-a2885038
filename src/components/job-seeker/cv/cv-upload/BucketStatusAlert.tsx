
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";

interface BucketStatusAlertProps {
  bucketReady: boolean;
  storageError: string | null;
  onRefreshStatus: () => Promise<void>;
}

export const BucketStatusAlert = ({ 
  bucketReady, 
  storageError, 
  onRefreshStatus 
}: BucketStatusAlertProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshStatus();
    setIsRefreshing(false);
  };

  if (!storageError) return null;

  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {storageError}
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-2" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Refresh Status
        </Button>
      </AlertDescription>
    </Alert>
  );
};
