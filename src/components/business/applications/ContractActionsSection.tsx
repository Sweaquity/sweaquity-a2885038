import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractUploadDialog } from "./ContractUploadDialog";
import { useContractManagement } from "@/hooks/jobs/useContractManagement";
import { Application } from "@/types/business";
import { AcceptedJob } from "@/hooks/useAcceptedJobs";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Download, FileText, Upload, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { useWorkContractManagement } from "@/hooks/useWorkContractManagement";
import { useAwardAgreementManagement } from "@/hooks/useAwardAgreementManagement";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { ContractSignatureDialog } from "@/components/documents/ContractSignatureDialog";

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
  const [activeTab, setActiveTab] = useState<'upload' | 'contract' | 'award'>('upload');
  const [workContractDoc, setWorkContractDoc] = useState<any>(null);
  const [awardAgreementDoc, setAwardAgreementDoc] = useState<any>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activeDocumentType, setActiveDocumentType] = useState<'work_contract' | 'award_agreement'>('work_contract');
  
  const { isUploading, uploadContract } = useContractManagement(onUpdate);
  
  // Only initialize these hooks if the dependencies exist
  const workContractHook = useWorkContractManagement ? useWorkContractManagement() : {
    isGenerating: false,
    isLoadingDocuments: false,
    generateWorkContract: async () => {},
    getWorkContract: async () => null
  };
  
  const awardAgreementHook = useAwardAgreementManagement ? useAwardAgreementManagement() : {
    isGenerating: false,
    isLoadingDocuments: false,
    generateAwardAgreement: async () => {},
    getAwardAgreement: async () => null
  };
  
  const { 
    isGenerating: isGeneratingWorkContract, 
    isLoadingDocuments: isLoadingWorkContract,
    generateWorkContract,
    getWorkContract
  } = workContractHook;
  
  const {
    isGenerating: isGeneratingAwardAgreement,
    isLoadingDocuments: isLoadingAwardAgreement,
    generateAwardAgreement,
    getAwardAgreement
  } = awardAgreementHook;
  
  // Only show contract actions if both parties have accepted
  if (!application.accepted_business || !application.accepted_jobseeker || !acceptedJob) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Contract Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Contract management will be available once both parties have accepted this application.
            </p>
            <div className="mt-2 text-sm">
              <p>Business accepted: {application.accepted_business ? '✅' : '❌'}</p>
              <p>Job seeker accepted: {application.accepted_jobseeker ? '✅' : '❌'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const handleUploadContract = async (jobAppId: string, file: File, notes: string) => {
    try {
      return await uploadContract(jobAppId, file);
    } catch (error) {
      console.error('Error uploading contract:', error);
      toast.error("Failed to upload contract");
      throw error;
    }
  };

  const loadDocuments = async () => {
    if (!acceptedJob?.id) return;
    
    try {
      // Only try to load documents if the functions exist
      if (getWorkContract) {
        const workContract = await getWorkContract(acceptedJob.id);
        setWorkContractDoc(workContract);
      }
      
      if (getAwardAgreement) {
        const awardAgreement = await getAwardAgreement(acceptedJob.id);
        setAwardAgreementDoc(awardAgreement);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      // Don't show error to user for missing functionality
    }
  };
  
  const handleCreateWorkContract = async () => {
    if (!acceptedJob?.id || !application.job_app_id || !generateWorkContract) return;
    
    try {
      // Get the business ID from the application
      const businessId = application.businesses?.businesses_id || '';
      const userId = application.user_id || '';
      const projectId = application.project_id || '';
      
      await generateWorkContract(
        acceptedJob.id,
        businessId,
        userId,
        projectId,
        application.job_app_id
      );
      
      toast.success("Work contract created");
      loadDocuments();
      setActiveTab('contract');
    } catch (error) {
      console.error("Error generating work contract:", error);
      toast.error("Failed to create work contract");
    }
  };
  
  const handleCreateAwardAgreement = async () => {
    if (!acceptedJob?.id || !application.job_app_id || !generateAwardAgreement) return;
    
    try {
      // Get the business ID from the application
      const businessId = application.businesses?.businesses_id || '';
      const userId = application.user_id || '';
      const projectId = application.project_id || '';
      
      await generateAwardAgreement(
        acceptedJob.id,
        businessId,
        userId,
        projectId,
        application.job_app_id,
        "completed the agreed services and milestones"
      );
      
      toast.success("Award agreement created");
      loadDocuments();
      setActiveTab('award');
    } catch (error) {
      console.error("Error generating award agreement:", error);
      toast.error("Failed to create award agreement");
    }
  };
  
  const handleSignDocument = (docId: string, docType: 'work_contract' | 'award_agreement') => {
    setActiveDocumentId(docId);
    setActiveDocumentType(docType);
    setIsSignatureDialogOpen(true);
  };
  
  const handleTabChange = (tab: 'upload' | 'contract' | 'award') => {
    setActiveTab(tab);
    loadDocuments();
  };
  
  const handleDocumentSigned = () => {
    loadDocuments();
    onUpdate();
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Contract Management
        </CardTitle>
        
        <div className="flex space-x-1 rounded-lg bg-muted p-1 text-muted-foreground mt-2">
          <button
            onClick={() => handleTabChange('upload')}
            className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === 'upload'
                ? 'bg-background text-foreground shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => handleTabChange('contract')}
            className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === 'contract'
                ? 'bg-background text-foreground shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            Work Contract
          </button>
          <button
            onClick={() => handleTabChange('award')}
            className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === 'award'
                ? 'bg-background text-foreground shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            Award Agreement
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {activeTab === 'upload' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">External Contract</p>
                <p className="text-sm text-muted-foreground">
                  {acceptedJob?.document_url 
                    ? "External contract uploaded" 
                    : "Pending external contract upload"}
                </p>
              </div>
              <Badge
                variant={acceptedJob?.document_url ? "default" : "outline"}
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
                  View/Download External Contract
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </a>
            ) : (
              <Button 
                onClick={() => setIsUploadDialogOpen(true)}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload External Contract Document
              </Button>
            )}
          </>
        )}
        
        {activeTab === 'contract' && (
          <>
            {workContractDoc ? (
              <DocumentViewer 
                documentId={workContractDoc.id}
                documentType="work_contract"
                documentTitle="Equity Work Contract"
                documentContent={workContractDoc.content}
                documentStatus={workContractDoc.status}
                onSign={workContractDoc.status === 'final' ? 
                  () => handleSignDocument(workContractDoc.id, 'work_contract') : undefined}
              />
            ) : (
              <div className="text-center p-6 border rounded-md">
                {isLoadingWorkContract || isGeneratingWorkContract ? (
                  <p>Loading work contract...</p>
                ) : (
                  <>
                    <p className="mb-4">No work contract has been created yet.</p>
                    {generateWorkContract ? (
                      <Button onClick={handleCreateWorkContract}>
                        <FileCheck className="h-4 w-4 mr-2" />
                        Generate Work Contract
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Work contract generation is not available.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'award' && (
          <>
            {awardAgreementDoc ? (
              <DocumentViewer 
                documentId={awardAgreementDoc.id}
                documentType="award_agreement"
                documentTitle="Equity Award Agreement"
                documentContent={awardAgreementDoc.content}
                documentStatus={awardAgreementDoc.status}
                onSign={awardAgreementDoc.status === 'final' ? 
                  () => handleSignDocument(awardAgreementDoc.id, 'award_agreement') : undefined}
              />
            ) : (
              <div className="text-center p-6 border rounded-md">
                {isLoadingAwardAgreement || isGeneratingAwardAgreement ? (
                  <p>Loading award agreement...</p>
                ) : (
                  <>
                    <p className="mb-4">No award agreement has been created yet.</p>
                    {workContractDoc && generateAwardAgreement ? (
                      <Button onClick={handleCreateAwardAgreement}>
                        <FileCheck className="h-4 w-4 mr-2" />
                        Generate Award Agreement
                      </Button>
                    ) : generateAwardAgreement ? (
                      <p className="text-sm text-muted-foreground">
                        You need to create a work contract first before generating an award agreement.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Award agreement generation is not available.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Contract Upload Dialog */}
        <ContractUploadDialog
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          application={application}
          onUpload={handleUploadContract}
          isUploading={isUploading}
        />
        
        {/* Contract Signature Dialog */}
        {activeDocumentId && acceptedJob && (
          <ContractSignatureDialog
            open={isSignatureDialogOpen}
            onOpenChange={setIsSignatureDialogOpen}
            documentId={activeDocumentId}
            documentType={activeDocumentType}
            acceptedJobId={acceptedJob.id}
            onSigned={handleDocumentSigned}
          />
        )}
      </CardContent>
    </Card>
  );
};
