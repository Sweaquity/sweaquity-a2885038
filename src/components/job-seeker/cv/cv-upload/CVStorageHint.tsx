
import { AlertCircle } from "lucide-react";

interface CVStorageHintProps {
  bucketReady: boolean;
  showEmptyState: boolean;
}

export const CVStorageHint = ({ bucketReady, showEmptyState }: CVStorageHintProps) => {
  if (!bucketReady) {
    return (
      <div className="text-sm text-yellow-600 flex items-center gap-2 p-2 bg-yellow-50 rounded-md">
        <AlertCircle className="h-4 w-4" />
        <span>CV storage is not available. Please refresh the bucket status or contact support if the issue persists.</span>
      </div>
    );
  }

  if (showEmptyState) {
    return (
      <div className="text-sm text-muted-foreground">
        <p>Upload your CV to help us understand your skills and experience. We'll automatically extract information to enhance your profile.</p>
      </div>
    );
  }

  return null;
};
