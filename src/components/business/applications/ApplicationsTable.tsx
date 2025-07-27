// 🔧 Enhanced ApplicationsTable with Auto Contract Generation - FIXED EQUITY REFERENCES
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ApplicationsTableProps {
  status: string;
}

export const ApplicationsTable = ({ status }: ApplicationsTableProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectFilter, setProjectFilter] = useState<string | null>(searchParams.get('project') || null);
  const [projects, setProjects] = useState<any[]>([]);
  const [applicationCount, setApplicationCount] = useState<number>(0);
  const [pendingActionCount, setPendingActionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // 🔧 FIXED: Auto-create accepted_jobs when status changes to 'accepted'
  const createAcceptedJobRecord = async (application: any) => {
    try {
      console.log('Creating accepted_jobs record for application:', application.job_app_id);
      
      // Check if accepted_jobs record already exists
      const { data: existingJob, error: checkError } = await supabase
        .from('accepted_jobs')
        .select('id')
        .eq('job_app_id', application.job_app_id)
        .single();
        
      if (existingJob) {
        console.log('Accepted job record already exists:', existingJob.id);
        return existingJob;
      }
      
      // 🎯 FIXED: Get task details with correct column names for equity calculation
      // Based on your schema, business_roles contains the task-level equity allocation
      const { data: taskData, error: taskError } = await supabase
        .from('business_roles')
        .select(`
          project_id,
          equity_allocation,
          role_id,
          title,
          description
        `)
        .eq('role_id', application.role_id)
        .single();
        
      if (taskError) {
        console.error('Error fetching task data:', taskError);
        console.error('Attempted to fetch role_id:', application.role_id);
        throw new Error(`Failed to fetch task equity information: ${taskError.message}`);
      }

      if (!taskData) {
        throw new Error('No task data found for the specified role');
      }

      // 💡 EQUITY FLOW EXPLANATION:
      // 1. business_roles.equity_allocation = Total equity allocated to this specific task/role
      // 2. accepted_jobs.equity_agreed = Agreed equity when job is accepted (copied from business_roles.equity_allocation)
      // 3. accepted_jobs.jobs_equity_allocated = Actually allocated equity as work progresses (starts at 0)
      
      const taskEquityAllocation = taskData.equity_allocation || 0;
      
      console.log('Task equity allocation:', taskEquityAllocation);
      
      // 🔧 ENHANCED: Create the accepted_jobs record with proper equity tracking
      const { data: newAcceptedJob, error: createError } = await supabase
        .from('accepted_jobs')
        .insert({
          job_app_id: application.job_app_id,
          user_id: application.user_id,
          business_id: application.business_id,
          project_id: taskData.project_id,
          role_id: application.role_id,
          // 💰 EQUITY AGREED: This is the total equity the job seeker will earn for completing this task
          equity_agreed: taskEquityAllocation,
          // 📊 EQUITY ALLOCATED: This starts at 0 and increases as work is completed
          jobs_equity_allocated: 0,
          date_accepted: new Date().toISOString(),
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating accepted job:', createError);
        throw new Error(`Failed to create contract record: ${createError.message}`);
      }
      
      console.log('Created accepted_jobs record:', newAcceptedJob);
      
      // 🔧 ENHANCED: Update the application to mark both parties as accepted
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({
          accepted_business: true,
          accepted_jobseeker: true,
          updated_at: new Date().toISOString()
        })
        .eq('job_app_id', application.job_app_id);
        
      if (updateError) {
        console.error('Error updating application acceptance:', updateError);
        throw new Error(`Failed to update application status: ${updateError.message}`);
      }
      
      // 🎉 SUCCESS: Log to system for audit trail
      try {
        await supabase
          .from('system_logs')
          .insert({
            event_type: 'auto_contract_creation',
            description: `Automatically created contract for application ${application.job_app_id}`,
            metadata: {
              job_app_id: application.job_app_id,
              user_id: application.user_id,
              business_id: application.business_id,
              equity_agreed: taskEquityAllocation,
              role_title: taskData.title
            }
          });
      } catch (logError) {
        // Don't fail the main operation if logging fails
        console.warn('Failed to log contract creation:', logError);
      }
      
      toast.success(`Job accepted! Contract created with ${taskEquityAllocation}% equity allocation.`);
      return newAcceptedJob;
      
    } catch (error) {
      console.error('Error in createAcceptedJobRecord:', error);
      toast.error(`Failed to process job acceptance: ${error.message}`);
      throw error;
    }
  };

  // 🔧 ENHANCED: Monitor for newly accepted applications and auto-process them
  useEffect(() => {
    const monitorAcceptedApplications = async () => {
      if (status !== 'accepted') return;
      
      try {
        // Get all accepted applications that don't have accepted_jobs records yet
        const { data: acceptedApps, error: fetchError } = await supabase
          .from('job_applications')
          .select(`
            job_app_id,
            user_id,
            role_id,
            status,
            accepted_business,
            accepted_jobseeker,
            business_id,
            project_id
          `)
          .eq('status', 'accepted');
          
        if (fetchError) {
          console.error('Error fetching accepted applications:', fetchError);
          return;
        }
        
        if (acceptedApps && acceptedApps.length > 0) {
          console.log(`Found ${acceptedApps.length} accepted applications to check`);
          
          // Check which ones need accepted_jobs records
          for (const app of acceptedApps) {
            // Check if accepted_jobs record exists
            const { data: existingJob } = await supabase
              .from('accepted_jobs')
              .select('id')
              .eq('job_app_id', app.job_app_id)
              .single();
              
            if (!existingJob && (!app.accepted_business || !app.accepted_jobseeker)) {
              console.log('Auto-processing accepted application:', app.job_app_id);
              await createAcceptedJobRecord(app);
            }
          }
          
          // Refresh the count after processing
          setTimeout(() => {
            fetchApplicationCount();
          }, 1000);
        }
      } catch (error) {
        console.error('Error monitoring accepted applications:', error);
      }
    };
    
    monitorAcceptedApplications();
  }, [status]);

  // Fetch available projects for filtering
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: businessProjects, error } = await supabase
          .from('business_projects')
          .select('project_id, title');
          
        if (error) {
          console.error('Error fetching projects for filtering:', error);
          return;
        }
        
        setProjects(businessProjects || []);
      } catch (error) {
        console.error('Error in project fetching:', error);
      }
    };
    
    fetchProjects();
  }, []);

  // 🔧 ENHANCED: Fetch application count with better error handling
  const fetchApplicationCount = async () => {
    setLoading(true);
    try {
      // Base query builder
      let query = supabase
        .from('job_applications')
        .select('job_app_id, status, accepted_business, accepted_jobseeker', { count: 'exact' })
        .eq('status', status);
        
      // Add project filter if selected
      if (projectFilter) {
        query = query.eq('project_id', projectFilter);
      }
      
      // Execute the query
      const { data, count, error } = await query;
      
      if (error) {
        console.error('Error fetching application count:', error);
        return;
      }
      
      setApplicationCount(count || 0);
      
      // 🔧 ENHANCED: Count applications that need processing
      if (status === 'accepted') {
        // Count applications that are accepted but don't have both party acceptances
        const needsProcessing = data?.filter(app => 
          !app.accepted_business || !app.accepted_jobseeker
        ).length || 0;
        
        setPendingActionCount(needsProcessing);
      } else if (status === 'pending') {
        // For pending, all applications need attention
        setPendingActionCount(count || 0);
      } else {
        setPendingActionCount(0);
      }
    } catch (error) {
      console.error('Error counting applications:', error);
      toast.error('Failed to load application count');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationCount();
  }, [status, projectFilter]);

  // Update URL params when project filter changes
  const handleProjectFilterChange = (value: string) => {
    setProjectFilter(value === 'all' ? null : value);
    
    // Update URL search params
    if (value === 'all') {
      searchParams.delete('project');
    } else {
      searchParams.set('project', value);
    }
    setSearchParams(searchParams);
  };
  
  // Navigate to applications list with filter
  const handleViewApplications = () => {
    let url = `/business/dashboard?tab=applications&status=${status}`;
    if (projectFilter) {
      url += `&project=${projectFilter}`;
    }
    navigate(url);
  };

  // 🔧 ENHANCED: Better status descriptions with equity context
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          title: 'Pending Applications',
          description: 'Applications awaiting your review and decision'
        };
      case 'accepted':
        return {
          title: 'Accepted Applications', 
          description: 'Applications accepted by business. Contract generation with equity allocation happens automatically when both parties agree.'
        };
      case 'active':
        return {
          title: 'Active Contracts',
          description: 'Live contracts with ongoing work and equity allocation in progress.'
        };
      case 'completed':
        return {
          title: 'Completed Contracts',
          description: 'Finished contracts where all agreed equity has been allocated.'
        };
      default:
        return {
          title: 'Applications',
          description: 'View and manage job applications'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="text-lg font-semibold mb-1">
            {statusInfo.title}
            <Badge variant="secondary" className="ml-2">
              {applicationCount}
              {pendingActionCount > 0 && (
                <span className="ml-1 text-amber-600 font-bold">
                  {status === 'accepted' 
                    ? `(${pendingActionCount} auto-processing)` 
                    : `(${pendingActionCount} need attention)`
                  }
                </span>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {statusInfo.description}
          </p>
        </div>
        <div className="w-[200px]">
          <Select 
            value={projectFilter || 'all'} 
            onValueChange={handleProjectFilterChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.project_id} value={project.project_id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        ) : applicationCount === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              No {status} applications found{projectFilter && ' for this project'}
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              <button 
                onClick={handleViewApplications}
                className="text-blue-600 hover:underline"
              >
                View {applicationCount} {status} application{applicationCount !== 1 ? 's' : ''}
                {pendingActionCount > 0 && (
                  status === 'accepted' 
                    ? ` (${pendingActionCount} being processed)`
                    : ` (${pendingActionCount} need attention)`
                )}
              </button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
