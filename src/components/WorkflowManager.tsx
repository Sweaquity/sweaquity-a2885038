// 🚀 SELF-CONTAINED WORKFLOW MANAGER
// This file contains everything needed - no complex imports required

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Only import you need

// Types (defined in same file to avoid import issues)
interface JobApplication {
  job_app_id: string;
  user_id: string;
  project_id: string;
  task_id?: string;
  status: string;
  nda_document_id?: string;
  nda_status?: string;
}

interface LegalDocument {
  id: string;
  document_type: string;
  status: string;
  executed_at?: string;
  created_at: string;
}

interface AcceptedJob {
  id: string;
  equity_agreed: number;
  jobs_equity_allocated: number;
  work_contract_status?: string;
}

// Simple UI components (inline to avoid import complexity)
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`border rounded-lg p-4 ${className}`}>{children}</div>
);

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = "primary" 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  disabled?: boolean; 
  variant?: "primary" | "outline";
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded ${
      variant === "primary" 
        ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400" 
        : "border border-gray-300 hover:bg-gray-50"
    }`}
  >
    {children}
  </button>
);

const Badge = ({ children, color = "gray" }: { children: React.ReactNode; color?: string }) => (
  <span className={`px-2 py-1 text-xs rounded-full bg-${color}-100 text-${color}-800`}>
    {children}
  </span>
);

// Main Workflow Component
export const WorkflowManager = ({ applicationId }: { applicationId: string }) => {
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [ndaDocument, setNdaDocument] = useState<LegalDocument | null>(null);
  const [acceptedJob, setAcceptedJob] = useState<AcceptedJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Load all data
  useEffect(() => {
    loadWorkflowData();
  }, [applicationId]);

  const loadWorkflowData = async () => {
    try {
      // Load application
      const { data: appData } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_app_id', applicationId)
        .single();
      
      setApplication(appData);

      if (appData) {
        // Load NDA if exists
        const { data: ndaData } = await supabase
          .from('legal_documents')
          .select('*')
          .eq('job_application_id', applicationId)
          .eq('document_type', 'nda')
          .single();
        
        setNdaDocument(ndaData);

        // Load contract if application is accepted
        if (appData.status === 'accepted') {
          const { data: jobData } = await supabase
            .from('accepted_jobs')
            .select('*')
            .eq('job_app_id', applicationId)
            .single();
          
          setAcceptedJob(jobData);
        }
      }
    } catch (error) {
      console.error('Error loading workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptNDA = async () => {
    if (!ndaDocument) return;
    
    setActionLoading(true);
    try {
      await supabase
        .from('legal_documents')
        .update({
          status: 'executed_by_jobseeker',
          executed_at: new Date().toISOString()
        })
        .eq('id', ndaDocument.id);

      await supabase
        .from('job_applications')
        .update({ nda_status: 'executed_by_jobseeker' })
        .eq('job_app_id', applicationId);

      await loadWorkflowData(); // Refresh
      alert('NDA accepted successfully!');
    } catch (error) {
      console.error('Error accepting NDA:', error);
      alert('Failed to accept NDA');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptContract = async () => {
    if (!acceptedJob) return;
    
    setActionLoading(true);
    try {
      await supabase
        .from('legal_documents')
        .update({
          status: 'executed_by_jobseeker',
          executed_at: new Date().toISOString()
        })
        .eq('job_application_id', applicationId)
        .eq('document_type', 'work_contract');

      await supabase
        .from('accepted_jobs')
        .update({ work_contract_status: 'executed_by_jobseeker' })
        .eq('id', acceptedJob.id);

      await loadWorkflowData(); // Refresh
      alert('Contract accepted successfully! You can now begin work.');
    } catch (error) {
      console.error('Error accepting contract:', error);
      alert('Failed to accept contract');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Card><p>Loading workflow...</p></Card>;
  }

  if (!application) {
    return <Card><p>Application not found</p></Card>;
  }

  const showNDAStage = ['negotiation', 'pending', 'accepted'].includes(application.status);
  const showContractStage = application.status === 'accepted';
  const ndaExecuted = ndaDocument?.executed_at;
  const needsNDAAcceptance = ndaDocument && !ndaExecuted;

  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      <Card className="bg-blue-50">
        <h3 className="font-semibold mb-2">Application Workflow</h3>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${showNDAStage ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${showNDAStage ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <span className="text-sm">NDA Review</span>
          </div>
          {showContractStage && (
            <>
              <div className="flex-1 h-0.5 bg-blue-600" />
              <div className="flex items-center text-blue-600">
                <div className="w-3 h-3 rounded-full mr-2 bg-blue-600" />
                <span className="text-sm">Contract & Work</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* NDA Stage */}
      {showNDAStage && (
        <Card>
          <h4 className="font-medium mb-3">🔒 Non-Disclosure Agreement</h4>
          
          {!ndaDocument ? (
            <p className="text-gray-600">NDA document is being prepared...</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <Badge color={ndaExecuted ? "green" : "yellow"}>
                  {ndaExecuted ? "Executed" : "Pending Review"}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600">
                Created: {new Date(ndaDocument.created_at).toLocaleDateString()}
                {ndaExecuted && (
                  <span className="block text-green-600">
                    Executed: {new Date(ndaExecuted).toLocaleDateString()}
                  </span>
                )}
              </div>

              {needsNDAAcceptance && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Action Required:</strong> Please review and accept the NDA to proceed.
                  </p>
                  <Button
                    onClick={handleAcceptNDA}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Accepting...' : 'Accept NDA'}
                  </Button>
                </div>
              )}

              {ndaExecuted && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    ✅ NDA accepted. {showContractStage ? 'You can now proceed to contract review.' : 'Waiting for business response.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Contract Stage */}
      {showContractStage && (
        <Card>
          <h4 className="font-medium mb-3">📝 Work Contract</h4>
          
          {!acceptedJob ? (
            <p className="text-gray-600">Contract is being prepared...</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Agreed Equity:</span>
                  <p className="font-semibold">{acceptedJob.equity_agreed}%</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Earned Equity:</span>
                  <p className="font-semibold text-green-600">{acceptedJob.jobs_equity_allocated}%</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ 
                    width: `${(acceptedJob.jobs_equity_allocated / acceptedJob.equity_agreed) * 100}%` 
                  }}
                />
              </div>

              {acceptedJob.work_contract_status !== 'executed_by_jobseeker' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Action Required:</strong> Please review and accept the work contract to begin earning equity.
                  </p>
                  <Button
                    onClick={handleAcceptContract}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Accepting...' : 'Accept Contract'}
                  </Button>
                </div>
              )}

              {acceptedJob.work_contract_status === 'executed_by_jobseeker' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    ✅ Contract executed. You can now begin work and start earning equity!
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// Simple usage component for integration
export const WorkflowForApplication = ({ applicationId }: { applicationId: string }) => {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <WorkflowManager applicationId={applicationId} />
    </div>
  );
};