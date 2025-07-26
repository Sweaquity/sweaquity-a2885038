import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractUploadDialog } from "./ContractUploadDialog";
import { useContractManagement } from "@/hooks/jobs/useContractManagement";
import { Application } from "@/types/business";
import { AcceptedJob } from "@/hooks/useAcceptedJobs";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Download, FileText, Upload, FileCheck, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useWorkContractManagement } from "@/hooks/useWorkContractManagement";
import { useAwardAgreementManagement } from "@/hooks/useAwardAgreementManagement";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { ContractSignatureDialog } from "@/components/documents/ContractSignatureDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

interface EnhancedContractActionsSectionProps {
  application: Application;
  acceptedJob: AcceptedJob | null;
  onUpdate: () => void;
}

export const EnhancedContractActionsSection = ({
  application,
  acceptedJob,
  onUpdate
}: EnhancedContractActionsSectionProps) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'contract' | 'award'>('upload');
  const [workContractDoc, setWorkContractDoc] = useState<any>(null);
  const [awardAgreementDoc, setAwardAgreementDoc] = useState<any>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activeDocumentType, setActiveDocumentType] = useState<'work_contract' | 'award_agreement'>('work_contract');
  const [isCreatingAcceptedJob, setIsCreatingAcceptedJob] = useState(false);
  const [contractStatus, setContractStatus] = useState<'not_ready' | 'ready' | 'active'>('not_ready');
  
  const { isUploading, uploadContract } = useContractManagement(onUpdate);
  const { 
    isGenerating: isGeneratingWorkContract, 
    isLoadingDocuments: isLoadingWorkContract,
    generateWorkContract,
    getWorkContract
  } = useWorkContractManagement();
  
  const {
    isGenerating: isGeneratingAwardAgreement,
    isLoadingDocuments: isLoadingAwardAgreement,
    generateAwardAgreement,
    getAwardAgreement
  } = useAwardAgreementManagement();

  // 🔧 NEW: Auto-create accepted_jobs record if missing but application is accepted
  const ensureAcceptedJobExists = async () => {
    if (!application || application.status !== 'accepted') return;
    
    // If we already have an acceptedJob, we're good
    if (acceptedJob) {
      setContractStatus('active');
      return;
    }

    // Check if an accepted_jobs record exists but wasn't passed in
    try {
      const { data: existingJob, error } = await supabase
        .from('accepted_jobs')
        .select('*')
        .eq('job_app_id', application.job_app_id)
        .single();

      if (existingJob) {
        console.log('Found existing accepted job:', existingJob);
        setContractStatus('active');
        onUpdate(); // Trigger refresh to get the acceptedJob prop
        return;
      }

      // If no accepted_jobs record exists, we need to create one
      if (application.accepted_business && application.accepted_jobseeker) {
        console.log('Creating missing accepted_jobs record...');
        setIsCreatingAcceptedJob(true);
        
        // Get task details for equity
        const { data: taskData, error: taskError } = await supabase
          .from('business_roles')
          .select('equity_percentage, project_id')
          .eq('role_id', application.role_id)
          .single();
        
        if (taskError) throw taskError;
        
        // Create the accepted_jobs record
        const { data: newJob, error: createError } = await supabase
          .from('accepted_jobs')
          .insert({
            job_app_id: application.job_app_id,
            user_id: application.user_id,
            business_id: application.business_id,
            project_id: taskData.project_id,
            role_id: application.role_id,
            equity_agreed: taskData.equity_percentage || 0,
            jobs_equity_allocated: 0,
            date_accepted: new Date().toISOString(),
            status: 'active'
          })
          .select()
          .single();
          
        if (createError) throw createError;
        
        console.log('Created accepted job:', newJob);
        toast.success('Contract workspace is now ready!');
        setContractStatus('active');
        onUpdate(); // Trigger refresh
        
      } else {
        setContractStatus('ready');
      }
    } catch (error) {
      console.error('Error ensuring accepted job exists:', error);
      toast.error('Failed to prepare contract workspace');
    } finally {
      setIsCreatingAcceptedJob(false);
    }
  };

  // Check contract readiness on component mount and when dependencies change
  useEffect(() => {
    if (application?.status === 'accepted') {
      ensureAcceptedJobExists();
    } else {
      setContractStatus('not_ready');
    }
  }, [application?.status, application?.accepted_business, application?.accepted_jobseeker, acceptedJob]);

  const handleUploadContract = async (jobAppId: string, file: File, notes: string) => {
    return await uploadContract(jobAppId, file);
  };

  const loadDocuments = async () => {
    if (!acceptedJob?.id) return;
    
    try {
      // Load work contract
      const workContract = await getWorkContract(acceptedJob.id);
      setWorkContractDoc(workContract);
      
      // Load award agreement
      const awardAgreement = await getAwardAgreement(acceptedJob.id);
      setAwardAgreementDoc(awardAgreement);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Failed to load documents");
    }
  };
  
  const handleCreateWorkContract = async () => {
    if (!acceptedJob?.id || !application.job_app_id) return;
    
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
    if (!acceptedJob?.id || !application.job_app_id) return;
    
    try {
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

  // 🔧 NEW: Show different states based on contract readiness
  if (contractStatus === 'not_ready') {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
            Contract Management - Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Contract management will be available once this application is accepted by both parties.
              Current status: <Badge variant="outline">{application?.status || 'Unknown'}</Badge>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (contractStatus === 'ready') {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
            Contract Management - Preparing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This application has been accepted! Contract workspace is being prepared...
              {isCreatingAcceptedJob && (
                <div className="mt-2">
                  <div className="animate-pulse">Setting up contract management...</div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // contractStatus === 'active' - show full contract management interface
  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          Contract Management - Active
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
                    <Button onClick={handleCreateWorkContract}>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Generate Work Contract
                    </Button>
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
                    {workContractDoc ? (
                      <Button onClick={handleCreateAwardAgreement}>
                        <FileCheck className="h-4 w-4 mr-2" />
                        Generate Award Agreement
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        You need to create a work contract first before generating an award agreement.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
        
        <ContractUploadDialog
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          application={application}
          onUpload={handleUploadContract}
          isUploading={isUploading}
        />
        
        {activeDocumentId && (
          <ContractSignatureDialog
            open={isSignatureDialogOpen}
            onOpenChange={setIsSignatureDialogOpen}
            documentId={activeDocumentId}
            documentType={activeDocumentType}
            acceptedJobId={acceptedJob?.id || ''}
            onSigned={handleDocumentSigned}
          />
        )}
      </CardContent>
    </Card>
  );
};
