
import { Label } from "@/components/ui/label";
import { CVFile } from "@/hooks/job-seeker/useCVData";
import { CVLibraryItem } from "./CVLibraryItem";

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
  // Don't return null even if userCVs is empty - render the container
  // to prevent flashing/disappearing
  return (
    <div className="mt-6">
      <Label>My CV Library</Label>
      {userCVs.length > 0 ? (
        <div className="mt-2 border rounded-md divide-y">
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
        <div className="mt-2 border rounded-md p-4 text-center text-muted-foreground">
          No CVs uploaded yet
        </div>
      )}
    </div>
  );
};
