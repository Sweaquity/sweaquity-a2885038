import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { 
  downloadCV,
  deleteCV,
  previewCV,
  setDefaultCV
} from "@/utils/setupStorage";
import { CVFile } from "@/hooks/job-seeker/useCVData";

// Import refactored components
import { CVCardHeader } from "./CVCardHeader";
import { DefaultCVDisplay } from "./DefaultCVDisplay";
import { CVUploadForm } from "./CVUploadForm";
import { CVLibrary } from "./CVLibrary";
import { CVEmptyState } from "./CVEmptyState";

interface CVUploadCardProps {
  cvUrl: string | null;
  parsedCvData?: any;
  userCVs?: CVFile[];
  onCvListUpdated?: () => void;
}

export const CVUploadCard = ({ 
  cvUrl, 
  parsedCvData, 
  userCVs = [], 
  onCvListUpdated 
}: CVUploadCardProps) => {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<{type: string, fileName: string} | null>(null);

  useEffect(() => {
    setDisplayUrl(cvUrl || null);
  }, [cvUrl]);

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

        const success = await deleteCV(`${session.user.id}/${fileName}`);
        if (success && onCvListUpdated) {
          // If this was the default CV, clear the display URL
          if (displayUrl && displayUrl.includes(fileName)) {
            setDisplayUrl(null);
          }
          onCvListUpdated();
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
        setDisplayUrl(newUrl);
        if (onCvListUpdated) {
          onCvListUpdated();
        }
      }
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <Card>
      <CVCardHeader />
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <DefaultCVDisplay 
            displayUrl={displayUrl} 
            onPreview={handlePreview} 
          />
          
          <CVUploadForm 
            cvUrl={cvUrl} 
            onUploadComplete={() => onCvListUpdated?.()}
          />
        </div>
        
        <CVLibrary 
          userCVs={userCVs}
          processingAction={processingAction}
          onSetDefault={handleSetDefault}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
        
        <CVEmptyState displayUrl={displayUrl} userCVs={userCVs} />
      </CardContent>
    </Card>
  );
};
