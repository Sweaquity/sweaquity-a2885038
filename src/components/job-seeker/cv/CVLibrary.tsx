
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
    // Set mounted after a short delay to ensure user CVs are loaded
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || userCVs.length === 0) {
    return (
      <div className="mt-6">
        <Label>My CV Library</Label>
        <div className="mt-2 border rounded-md">
          <div className="p-4 text-center text-muted-foreground">
            {!mounted ? "Loading CV library..." : "No CVs uploaded yet"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Label>My CV Library</Label>
      <div className="mt-2 border rounded-md">
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
      </div>
    </div>
  );
};
