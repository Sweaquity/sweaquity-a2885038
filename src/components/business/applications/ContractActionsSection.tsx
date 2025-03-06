
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractUploadDialog } from "./ContractUploadDialog";
import { useContractManagement } from "@/hooks/jobs/useContractManagement";
import { Application } from "@/types/business";
import { AcceptedJob } from "@/hooks/jobs/useAcceptedJobsCore";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Download, FileText, Upload } from "lucide-react";

interface ContractActionsSectionProps {
  application: Application;
  acceptedJob: AcceptedJob | null;
  onUpdate: () => void;
}

export const ContractActionsSection = ({
  application,
  acceptedJob,
  onUpdate
}: ContractActionsSectionProps) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { isUploading, uploadContract } = useContractManagement(onUpdate);
  
  if (!application.accepted_business || !application.accepted_jobseeker) {
    return null;
  }
  
  const handleUploadContract = async (jobAppId: string, file: File, notes: string) => {
    return await uploadContract(jobAppId, file);
  };
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Contract Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Contract Status</p>
            <p className="text-sm text-muted-foreground">
              {acceptedJob?.document_url 
                ? "Contract uploaded" 
                : "Pending contract upload"}
            </p>
          </div>
          <Badge
            variant={acceptedJob?.document_url ? "success" : "outline"}
            className={acceptedJob?.document_url 
              ? "bg-green-100 text-green-800 border-green-300" 
              : ""}
          >
            {acceptedJob?.document_url ? "Uploaded" : "Pending"}
          </Badge>
        </div>
        
        {acceptedJob?.document_url ? (
          <a 
            href={acceptedJob.document_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button variant="outline" className="w-full flex justify-center items-center">
              <Download className="h-4 w-4 mr-2" />
              View/Download Contract
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </a>
        ) : (
          <Button 
            onClick={() => setIsUploadDialogOpen(true)}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Contract Document
          </Button>
        )}
        
        <ContractUploadDialog
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          application={application}
          onUpload={handleUploadContract}
          isUploading={isUploading}
        />
      </CardContent>
    </Card>
  );
};
