import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, Download, Trash2 } from "lucide-react";
import { CVFile } from "@/hooks/job-seeker/useCVData";

interface CVLibraryItemProps {
  cv: CVFile;
  processingAction: { type: string, fileName: string } | null;
  onSetDefault: (fileName: string) => Promise<void>;
  onPreview: (fileName: string) => Promise<void>;
  onDownload: (fileName: string) => Promise<void>;
  onDelete: (fileName: string) => Promise<void>;
}

export const CVLibraryItem = ({ 
  cv, 
  processingAction,
  onSetDefault,
  onPreview,
  onDownload,
  onDelete
}: CVLibraryItemProps) => {
  const isProcessing = Boolean(processingAction);

  return (
    <div className="p-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id={`default-${cv.id}`}
          checked={cv.is_default}
          onCheckedChange={() => {
            if (!cv.is_default) {
              onSetDefault(cv.name);
            }
          }}
          disabled={cv.is_default || isProcessing}
        />
        <Label 
          htmlFor={`default-${cv.id}`}
          className={`text-sm ${cv.is_default ? 'font-semibold' : ''}`}
        >
          {cv.name}
          {cv.is_default && <span className="text-xs text-muted-foreground ml-2">(Default)</span>}
        </Label>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onPreview(cv.name)}
          disabled={isProcessing}
        >
          {processingAction?.type === 'previewing' && processingAction.fileName === cv.name ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onDownload(cv.name)}
          disabled={isProcessing}
        >
          {processingAction?.type === 'downloading' && processingAction.fileName === cv.name ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onDelete(cv.name)}
          disabled={isProcessing}
          className="text-destructive hover:text-destructive"
        >
          {processingAction?.type === 'deleting' && processingAction.fileName === cv.name ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
