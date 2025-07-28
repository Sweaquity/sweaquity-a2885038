// 🎯 JOB SEEKER CONTRACT MANAGEMENT COMPONENT
// Create this file: src/components/job-seeker/dashboard/applications/JobSeekerContractSection.tsx

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  ArrowUpRight, 
  TrendingUp, 
  CheckCircle,
  Clock,
  AlertCircle 
} from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface JobSeekerContractSectionProps {
  application: JobApplication;
  onUpdate?: () => void;
}

interface AcceptedJobData {
  id: string;
  equity_agreed: number;
  jobs_equity_allocated: number;
  document_url?: string;
  date_accepted: string;
  status: string;
}

export const JobSeekerContractSection = ({ 
  application, 
  onUpdate 
}: JobSeekerContractSectionProps) => {
  const [acceptedJob, setAcceptedJob] = useState<AcceptedJobData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch accepted job data
  useEffect(() => {
    const fetchAcceptedJob = async () => {
      if (!application.job_app_id) return;
      
      try {
        const { data, error } = await supabase
          .from('accepted_jobs')
          .select('*')
          .eq('job_app_id', application.job_app_id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching accepted job:', error);
          return;
        }
        
        setAcceptedJob(data);
      } catch (err) {
        console.error('Error loading contract data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if application is accepted
    if (application.status === 'accepted') {
      fetchAcceptedJob();
    } else {
      setLoading(false);
    }
  }, [application.job_app_id, application.status]);

  // Don't show anything if not accepted or no contract data
  if (application.status !== 'accepted' || !acceptedJob) {
    return null;
  }

  const equityProgress = acceptedJob.equity_agreed > 0 
    ? (acceptedJob.jobs_equity_allocated / acceptedJob.equity_agreed) * 100 
    : 0;

  const handleDocumentDownload = () => {
    if (acceptedJob.document_url) {
      window.open(acceptedJob.document_url, '_blank');
    } else {
      toast.error("No document available for download");
    }
  };

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-pulse">Loading contract information...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          Contract & Equity Management
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Contract Status Section */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Contract Status
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contract Document */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Contract Document</p>
                <p className="text-xs text-muted-foreground">
                  {acceptedJob.document_url ? 'Ready for download' : 'Pending upload by business'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={acceptedJob.document_url ? "default" : "outline"}>
                  {acceptedJob.document_url ? "Available" : "Pending"}
                </Badge>
                {acceptedJob.document_url && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleDocumentDownload}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {/* Contract Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Work Status</p>
                <p className="text-xs text-muted-foreground">
                  {acceptedJob.status === 'active' ? 'Ready to begin work' : acceptedJob.status}
                </p>
              </div>
              <Badge variant={acceptedJob.status === 'active' ? "default" : "outline"}>
                {acceptedJob.status === 'active' ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                ) : (
                  <><Clock className="h-3 w-3 mr-1" /> {acceptedJob.status}</>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Equity Progress Section */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Equity Progress
          </h4>
          
          <div className="space-y-3">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Equity Earned</span>
                <span>{acceptedJob.jobs_equity_allocated}% of {acceptedJob.equity_agreed}%</span>
              </div>
              <Progress value={equityProgress} className="h-2" />
              <div className="text-xs text-muted-foreground text-center">
                {equityProgress.toFixed(1)}% of agreed equity earned
              </div>
            </div>

            {/* Equity Details */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-700">
                  {acceptedJob.equity_agreed}%
                </div>
                <div className="text-xs text-blue-600">Agreed Equity</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-700">
                  {acceptedJob.jobs_equity_allocated}%
                </div>
                <div className="text-xs text-green-600">Earned So Far</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">
                  {(acceptedJob.equity_agreed - acceptedJob.jobs_equity_allocated).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Remaining</div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps Section */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Next Steps
          </h4>
          
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm space-y-2">
              {!acceptedJob.document_url ? (
                <p>📋 Waiting for the business to upload the contract document.</p>
              ) : equityProgress === 0 ? (
                <p>🚀 Contract is ready! You can begin work on this project.</p>
              ) : equityProgress < 100 ? (
                <p>⚡ Continue working to earn your remaining {(acceptedJob.equity_agreed - acceptedJob.jobs_equity_allocated).toFixed(1)}% equity.</p>
              ) : (
                <p>🎉 Congratulations! You've earned your full equity allocation for this project.</p>
              )}
              
              <p className="text-xs text-muted-foreground">
                Check the "Live Projects" tab to track your work progress and log completed tasks.
              </p>
            </div>
          </div>
        </div>

        {/* Contract Date */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Contract created: {new Date(acceptedJob.date_accepted).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};
