
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CVFile } from "@/hooks/job-seeker/useCVData";
import { DefaultCVDisplay } from "./cv-upload/DefaultCVDisplay";
import { CVUploader } from "./cv-upload/CVUploader";
import { CVFileList } from "./cv-upload/CVFileList";
import { BucketStatusAlert } from "./cv-upload/BucketStatusAlert";
import { CVStorageHint } from "./cv-upload/CVStorageHint";
import { useBucketStatus } from "./cv-upload/useBucketStatus";
import { listUserCVs } from "@/utils/storage";
import { supabase } from "@/lib/supabase";

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
  const [localUserCVs, setLocalUserCVs] = useState<CVFile[]>([]);
  const { bucketReady, storageError, checkStorage } = useBucketStatus();

  useEffect(() => {
    if (cvUrl) {
      setDisplayUrl(cvUrl);
    }
  }, [cvUrl]);

  useEffect(() => {
    if (userCVs && userCVs.length > 0) {
      setLocalUserCVs(userCVs);
    }
  }, [userCVs]);

  const loadUserCVs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return;
      }
      
      const cvFiles = await listUserCVs(session.user.id);
      
      // Mark default CV
      const defaultCVUrl = cvUrl;
      const filesWithDefault = cvFiles.map(file => ({
        ...file,
        isDefault: defaultCVUrl ? defaultCVUrl.includes(file.name) : false
      }));
      
      setLocalUserCVs(filesWithDefault);
    } catch (error) {
      console.error("Error loading user CVs:", error);
    }
  };

  // Fix the function signature - this function is returning void anyway
  const handleCVsUpdated = async () => {
    await loadUserCVs();
    if (onCvListUpdated) {
      onCvListUpdated();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CV / Resume</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BucketStatusAlert 
          bucketReady={bucketReady} 
          storageError={storageError}
          onRefreshStatus={checkStorage}
        />
        
        <div className="space-y-4">
          <DefaultCVDisplay displayUrl={displayUrl} />
          
          <CVUploader 
            bucketReady={bucketReady}
            onUploadSuccess={handleCVsUpdated}
          />
        </div>
        
        <CVFileList 
          userCVs={localUserCVs}
          onCVsUpdated={handleCVsUpdated}
        />
        
        <CVStorageHint 
          bucketReady={bucketReady}
          showEmptyState={bucketReady && localUserCVs.length === 0 && !displayUrl}
        />
      </CardContent>
    </Card>
  );
};
