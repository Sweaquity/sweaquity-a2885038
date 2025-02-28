
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, Download, Trash2 } from "lucide-react";
import { CVFile } from "@/hooks/job-seeker/useCVData";
import { downloadCV, deleteCV, previewCV, setDefaultCV } from "@/utils/setupStorage";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface CVFileListProps {
  userCVs: CVFile[];
  onCVsUpdated: () => Promise<void>;
}

export const CVFileList = ({ userCVs, onCVsUpdated }: CVFileListProps) => {
  const [processingAction, setProcessingAction] = useState<{type: string, fileName: string} | null>(null);

  const handleDownload = async (fileName: string) => {
    setProcessingAction({ type: 'downloading', fileName });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to download CVs");
        return;
      }

      await downloadCV(session.user.id, fileName);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      setProcessingAction({ type: 'deleting', fileName });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast.error("You must be logged in to delete CVs");
          return;
        }

        const success = await deleteCV(session.user.id, fileName);
        if (success) {
          await onCVsUpdated();
        }
      } finally {
        setProcessingAction(null);
      }
    }
  };

  const handlePreview = async (fileName: string) => {
    setProcessingAction({ type: 'previewing', fileName });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to preview CVs");
        return;
      }

      await previewCV(session.user.id, fileName);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSetDefault = async (fileName: string) => {
    setProcessingAction({ type: 'setting-default', fileName });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to set default CV");
        return;
      }

      const newUrl = await setDefaultCV(session.user.id, fileName);
      if (newUrl) {
        await onCVsUpdated();
      }
    } finally {
      setProcessingAction(null);
    }
  };

  if (userCVs.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <Label>My CV Library</Label>
      <div className="mt-2 border rounded-md divide-y">
        {userCVs.map((cv) => (
          <div key={cv.id} className="p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`default-${cv.id}`}
                checked={cv.isDefault}
                onCheckedChange={() => {
                  if (!cv.isDefault) {
                    handleSetDefault(cv.name);
                  }
                }}
                disabled={cv.isDefault || Boolean(processingAction)}
              />
              <Label 
                htmlFor={`default-${cv.id}`}
                className={`text-sm ${cv.isDefault ? 'font-semibold' : ''}`}
              >
                {cv.name}
                {cv.isDefault && <span className="text-xs text-muted-foreground ml-2">(Default)</span>}
              </Label>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handlePreview(cv.name)}
                disabled={Boolean(processingAction)}
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
                onClick={() => handleDownload(cv.name)}
                disabled={Boolean(processingAction)}
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
                onClick={() => handleDelete(cv.name)}
                disabled={Boolean(processingAction)}
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
        ))}
      </div>
    </div>
  );
};
