
import { Label } from "@/components/ui/label";
import { CVFile } from "@/hooks/job-seeker/useCVData";
import { CVLibraryItem } from "./CVLibraryItem";
import { useEffect, useState } from "react";

interface CVLibraryProps {
  userCVs: CVFile[];
  processingAction: { type: string, fileName: string } | null;
  onSetDefault: (fileName: string) => Promise<void>;
  onPreview: (fileName: string) => Promise<void>;
  onDownload: (fileName: string) => Promise<void>;
  onDelete: (fileName: string) => Promise<void>;
}

export const CVLibrary = ({ 
  userCVs, 
  processingAction, 
  onSetDefault,
  onPreview,
  onDownload,
  onDelete
}: CVLibraryProps) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="mt-6">
      <Label>My CV Library</Label>
      <div className="mt-2 border rounded-md">
        {userCVs && userCVs.length > 0 ? (
          <div className="divide-y">
            {userCVs.map((cv) => (
              <CVLibraryItem
                key={cv.id}
                cv={cv}
                processingAction={processingAction}
                onSetDefault={onSetDefault}
                onPreview={onPreview}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No CVs uploaded yet
          </div>
        )}
      </div>
    </div>
  );
};
