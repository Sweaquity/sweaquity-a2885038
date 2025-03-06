
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
  if (userCVs.length === 0) return null;

  return (
    <div className="mt-6">
      <Label>My CV Library</Label>
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
    </div>
  );
};
