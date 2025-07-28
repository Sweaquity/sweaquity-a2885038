// 🔄 COMPLETE JobSeekerContractSection.tsx
// Full replacement that uses your existing sophisticated document management system
// Drop-in replacement for your current file

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  FileSignature,
  Eye,
  ExternalLink,
  Loader2,
  Users
} from "lucide-react";
import { toast } from "sonner";

// Import your existing sophisticated hooks
import { useNDAManagement } from "@/hooks/useNDAManagement";
import { useWorkContractManagement } from "@/hooks/useWorkContractManagement";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { supabase } from "@/lib/supabase";

// Use your existing JobApplication type
interface JobApplication {
  job_app_id: string;
  user_id: string;
  project_id: string;
  task_id?: string;
  status: string;
  nda_document_id?: string;
  nda_status?: string;
  business_roles?: {
    project?: {
      title: string;
      business?: {
        company_name: string;
      };
    };
  };
}

interface JobSeekerContractSectionProps {
  application: JobApplication;
  onUpdate?: () => void;
}

// 📋 NDA Workflow Component (Using Your Existing useNDAManagement Hook)
const NDAWorkflowSection = ({ 
  application, 
  onUpdate 
}: JobSeekerContractSectionProps) => {
  const [ndaDocument, setNdaDocument] = useState<any>(null);
  const [showContent, setShowContent] = useState(false);
  const [businessData, setBusinessData] = useState<any>(null);
  
  // Use your existing NDA management hook
  const { 
    isGenerating, 
    isLoadingDocuments,
    generateNDA, 
    getNDAForJobApplication,
    finalizeNDA 
  } = useNDAManagement();

  useEffect(() => {
    fetchBusinessData();
    fetchNDAData();
  }, [application.job_app_id]);

  const fetchBusinessData = async () => {
    try {
      const { data: projectData } = await supabase
        .from('business_projects')
        .select(`
          business_id,
          businesses:business_id (
            businesses_id,
            company_name,
            contact_person,
            contact_email
          )
        `)
        .eq('project_id', application.project_id)
        .single();
      
      setBusinessData(projectData);
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const fetchNDAData = async () => {
    try {
      const document = await getNDAForJobApplication(application.job_app_id);
      setNdaDocument(document);
    } catch (error) {
      console.error('Error fetching NDA:', error);
    }
  };

  const handleGenerateNDA = async () => {
    if (!businessData?.businesses?.businesses_id) {
      toast.error('Business information not found');
      return;
    }

    try {
      const documentId = await generateNDA(
        application.job_app_id,
        businessData.businesses.businesses_id,
        application.user_id,
        application.project_id
      );
      
      if (documentId) {
        toast.success('NDA generated successfully with business details!');
        await fetchNDAData();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error generating NDA:', error);
      toast.error('Failed to generate NDA');
    }
  };

  const handleAcceptNDA = async () => {
    if (!ndaDocument) return;
    
    try {
      // Update the legal document to mark as executed by jobseeker
      const { error: docError } = await supabase
        .from('legal_documents')
        .update({
          status: 'executed_by_jobseeker',
          executed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', ndaDocument.id);
        
      if (docError) throw docError;
      
      // Update the job application NDA status
      const { error: appError } = await supabase
        .from('job_applications')
        .update({
          nda_status: 'executed_by_jobseeker',
          updated_at: new Date().toISOString()
        })
        .eq('job_app_id', application.job_app_id);
        
      if (appError) throw appError;
      
      // Finalize the NDA using your existing hook
      await finalizeNDA(ndaDocument.id);
      
      toast.success('NDA accepted successfully!');
      await fetchNDAData();
      onUpdate?.();
      
    } catch (error) {
      console.error('Error accepting NDA:', error);
      toast.error('Failed to accept NDA');
    }
  };

  if (isLoadingDocuments) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading NDA information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ndaDocument) {
    return (
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2 text-amber-500" />
              Non-Disclosure Agreement
            </div>
            <Badge variant="outline">Required</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Project:</strong> {application.business_roles?.project?.title || 'Project'}
            <br />
            <strong>Business:</strong> {businessData?.businesses?.company_name || 'Loading...'}
          </div>
          
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-800">Generate NDA Required</p>
                <p className="text-sm text-amber-600">
                  Create a non-disclosure agreement with real business and project details to proceed.
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleGenerateNDA}
            disabled={isGenerating || !businessData?.businesses}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating NDA with Business Details...
              </>
            ) : (
              <>
                <FileSignature className="h-4 w-4 mr-2" />
                Generate Real NDA Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isExecuted = ndaDocument.status === 'executed_by_jobseeker' || ndaDocument.status === 'final';
  const needsReview = ndaDocument.status === 'draft' || ndaDocument.status === 'pending_jobseeker_review';

  return (
    <Card className={`border-l-4 ${isExecuted ? 'border-l-green-500' : 'border-l-blue-500'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <Shield className={`h-4 w-4 mr-2 ${isExecuted ? 'text-green-500' : 'text-blue-500'}`} />
            Non-Disclosure Agreement
          </div>
          <Badge variant={isExecuted ? "default" : needsReview ? "destructive" : "secondary"}>
            {isExecuted ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> Executed</>
            ) : needsReview ? (
              <><AlertCircle className="h-3 w-3 mr-1" /> Review Required</>
            ) : (
              <><Clock className="h-3 w-3 mr-1" /> {ndaDocument.status}</>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Project Context */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <strong>Project:</strong> {application.business_roles?.project?.title || 'Project'}
          <br />
          <strong>Business:</strong> {businessData?.businesses?.company_name || 'Business'}
          <br />
          <strong>Document Created:</strong> {new Date(ndaDocument.created_at).toLocaleDateString()}
        </div>

        {/* Document Actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Generated NDA Document</p>
            <p className="text-xs text-gray-500">
              Contains real business and jobseeker details
            </p>
          </div>
          <div className="flex space-x-2">
            {ndaDocument.htmlContent && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowContent(!showContent)}
              >
                <Eye className="h-3 w-3 mr-1" />
                {showContent ? 'Hide' : 'Preview'}
              </Button>
            )}
            {ndaDocument.storage_path && (
              <Button variant="outline" size="sm" asChild>
                <a href={ndaDocument.storage_path} target="_blank" rel="noopener noreferrer">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </div>
        
        {/* Document Content Preview */}
        {showContent && ndaDocument.htmlContent && (
          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h5 className="font-medium">NDA Document Preview</h5>
              <Button variant="ghost" size="sm" onClick={() => setShowContent(false)}>
                ✕
              </Button>
            </div>
            <div 
              className="text-xs text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: ndaDocument.htmlContent }}
            />
          </div>
        )}

        {/* Action Section */}
        {needsReview && !isExecuted && (
          <>
            <Separator />
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800 mb-3">
                <strong>Action Required:</strong> Please review the generated NDA with real business details and accept to proceed.
              </p>
              <Button 
                onClick={handleAcceptNDA}
                className="w-full"
              >
                <FileSignature className="h-4 w-4 mr-2" />
                Review & Accept NDA
              </Button>
            </div>
          </>
        )}

        {isExecuted && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">
              ✅ NDA executed and accepted
              {application.status === 'accepted' && (
                <span className="block mt-1 font-medium">
                  You can now proceed to contract review below.
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 🤝 Enhanced Contract Section (Using Your Existing useWorkContractManagement Hook)
const ContractWorkflowSection = ({ 
  application, 
  onUpdate 
}: JobSeekerContractSectionProps) => {
  const [acceptedJob, setAcceptedJob] = useState<any>(null);
  const [contractDocument, setContractDocument] = useState<any>(null);
  const [businessData, setBusinessData] = useState<any>(null);

  // Use your existing hooks
  const { getAcceptedJob, isLoading } = useAcceptedJobs(onUpdate);
  const { 
    isGenerating, 
    isLoadingDocuments,
    generateWorkContract, 
    getWorkContract 
  } = useWorkContractManagement();

  useEffect(() => {
    fetchContractData();
  }, [application.job_app_id]);

  const fetchContractData = async () => {
    if (application.status !== 'accepted') return;
    
    try {
      // Get accepted job using your existing hook
      const jobData = await getAcceptedJob(application.job_app_id);
      setAcceptedJob(jobData);

      // Get work contract if it exists
      if (jobData?.id) {
        const contractData = await getWorkContract(jobData.id);
        setContractDocument(contractData);
      }

      // Get business data
      const { data: projectData } = await supabase
        .from('business_projects')
        .select(`
          business_id,
          businesses:business_id (
            businesses_id,
            company_name,
            contact_person
          )
        `)
        .eq('project_id', application.project_id)
        .single();
      
      setBusinessData(projectData);
      
    } catch (err) {
      console.error('Error loading contract data:', err);
    }
  };

  const handleGenerateContract = async () => {
    if (!acceptedJob || !businessData?.businesses?.businesses_id) {
      toast.error('Missing required data for contract generation');
      return;
    }

    try {
      const documentId = await generateWorkContract(
        acceptedJob.id,
        businessData.businesses.businesses_id,
        application.user_id,
        application.project_id,
        application.job_app_id
      );
      
      if (documentId) {
        toast.success('Work contract generated with equity details!');
        await fetchContractData();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error generating contract:', error);
      toast.error('Failed to generate work contract');
    }
  };

  const handleAcceptContract = async () => {
    if (!contractDocument || !acceptedJob) return;
    
    try {
      // Update the contract document
      const { error: docError } = await supabase
        .from('legal_documents')
        .update({
          status: 'executed_by_jobseeker',
          executed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contractDocument.id);
        
      if (docError) throw docError;
      
      // Update the accepted job contract status
      const { error: jobError } = await supabase
        .from('accepted_jobs')
        .update({
          work_contract_status: 'executed_by_jobseeker',
          updated_at: new Date().toISOString()
        })
        .eq('id', acceptedJob.id);
        
      if (jobError) throw jobError;
      
      toast.success('Contract accepted! You can now begin work and start earning equity.');
      await fetchContractData();
      onUpdate?.();
      
    } catch (error) {
      console.error('Error accepting contract:', error);
      toast.error('Failed to accept contract');
    }
  };

  if (isLoading || isLoadingDocuments) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading contract information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!acceptedJob) {
    return (
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <FileText className="h-4 w-4 mr-2 text-amber-500" />
            Work Contract & Equity Agreement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-800">Contract Being Prepared</p>
                <p className="text-sm text-amber-600">
                  Your application has been accepted! The work contract and equity agreement are being set up.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const equityProgress = acceptedJob.equity_agreed > 0 
    ? (acceptedJob.jobs_equity_allocated / acceptedJob.equity_agreed) * 100 
    : 0;

  const isContractExecuted = contractDocument?.status === 'executed_by_jobseeker';
  const needsContractReview = contractDocument?.status === 'draft';

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2 text-green-500" />
            Work Contract & Equity Agreement
          </div>
          <Badge variant={isContractExecuted ? "default" : "secondary"}>
            {isContractExecuted ? "Active" : "Setup Required"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Contract Generation/Status */}
        {!contractDocument ? (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Generate Work Contract</p>
                <p className="text-xs text-blue-600">
                  Create your formal work agreement with equity terms ({acceptedJob.equity_agreed?.toFixed(2) || 0}% equity)
                </p>
              </div>
              <Button 
                onClick={handleGenerateContract}
                disabled={isGenerating}
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileSignature className="h-3 w-3 mr-1" />
                    Generate Contract
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium">Contract Document</p>
              <p className="text-xs text-gray-500 mb-2">
                Created {new Date(contractDocument.created_at).toLocaleDateString()}
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant={isContractExecuted ? "default" : needsContractReview ? "destructive" : "secondary"}>
                  {isContractExecuted ? "Executed" : needsContractReview ? "Review Required" : contractDocument.status}
                </Badge>
                {contractDocument.storage_path && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={contractDocument.storage_path} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium">Work Status</p>
              <p className="text-xs text-gray-500 mb-2">
                {isContractExecuted ? 'Ready to begin work' : 'Pending contract execution'}
              </p>
              <Badge variant={isContractExecuted ? "default" : "outline"}>
                {isContractExecuted ? 'Active' : 'Pending'}
              </Badge>
            </div>
          </div>
        )}

        {/* Contract Acceptance */}
        {needsContractReview && !isContractExecuted && contractDocument && (
          <>
            <Separator />
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800 mb-3">
                <strong>Final Step:</strong> Review and accept your work contract with {acceptedJob.equity_agreed?.toFixed(2) || 0}% equity allocation.
              </p>
              <div className="flex space-x-2">
                {contractDocument.htmlContent && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // You could add a modal or preview here
                      window.open(contractDocument.storage_path, '_blank');
                    }}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review Contract
                  </Button>
                )}
                <Button 
                  onClick={handleAcceptContract}
                  className="flex-1"
                >
                  <FileSignature className="h-4 w-4 mr-2" />
                  Accept Contract
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Equity Progress */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Equity Progress
          </h4>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Equity Earned</span>
                <span>{acceptedJob.jobs_equity_allocated?.toFixed(2) || 0}% of {acceptedJob.equity_agreed?.toFixed(2) || 0}%</span>
              </div>
              <Progress value={equityProgress} className="h-2" />
              <div className="text-xs text-muted-foreground text-center">
                {equityProgress.toFixed(1)}% of agreed equity earned
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-700">
                  {acceptedJob.equity_agreed?.toFixed(2) || 0}%
                </div>
                <div className="text-xs text-blue-600">Agreed</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-700">
                  {acceptedJob.jobs_equity_allocated?.toFixed(2) || 0}%
                </div>
                <div className="text-xs text-green-600">Earned</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">
                  {((acceptedJob.equity_agreed || 0) - (acceptedJob.jobs_equity_allocated || 0)).toFixed(2)}%
                </div>
                <div className="text-xs text-gray-600">Remaining</div>
              </div>
            </div>
          </div>
        </div>

        {isContractExecuted && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">
              ✅ All documents executed! You can now access project tasks and begin earning equity.
              <span className="block mt-1 text-xs">
                Check the "Live Projects" tab to view your tasks and track time.
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 🎯 MAIN COMPONENT - Complete JobSeekerContractSection
export const JobSeekerContractSection = ({ 
  application, 
  onUpdate 
}: JobSeekerContractSectionProps) => {
  // Show workflow for these statuses
  const showNDAWorkflow = ['negotiation', 'pending', 'accepted'].includes(application.status);
  const showContractWorkflow = application.status === 'accepted';
  
  // Don't show anything if not in workflow statuses
  if (!showNDAWorkflow && !showContractWorkflow) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Workflow Progress Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-800 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Application Workflow Progress
            </h3>
            <Badge variant="outline">
              {application.status === 'accepted' ? 'Stage 2 of 2' : 'Stage 1 of 2'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${showNDAWorkflow ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${showNDAWorkflow ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className="text-sm font-medium">NDA Review</span>
            </div>
            <div className={`flex-1 h-0.5 ${showContractWorkflow ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center space-x-2 ${showContractWorkflow ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${showContractWorkflow ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className="text-sm font-medium">Contract & Work</span>
            </div>
          </div>
          
          <p className="text-xs text-blue-600 mt-2">
            {application.status === 'negotiation' && "Business is interested! Generate and complete NDA review to proceed."}
            {application.status === 'pending' && "Application under review. NDA generation and acceptance required."}
            {application.status === 'accepted' && "Congratulations! Complete contract setup with real equity terms to begin work."}
          </p>
        </CardContent>
      </Card>

      {/* NDA Workflow Section */}
      {showNDAWorkflow && (
        <NDAWorkflowSection 
          application={application} 
          onUpdate={onUpdate} 
        />
      )}
      
      {/* Contract Workflow Section */}
      {showContractWorkflow && (
        <ContractWorkflowSection 
          application={application} 
          onUpdate={onUpdate} 
        />
      )}
    </div>
  );
};