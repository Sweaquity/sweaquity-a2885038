// 🔧 Enhanced ApplicationsTable with Auto Contract Generation
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

  // 🔧 NEW: Auto-create accepted_jobs when status changes to 'accepted'
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
      
      // Get task details for equity calculation
      const { data: taskData, error: taskError } = await supabase
        .from('business_roles')
        .select('equity_percentage, project_id')
        .eq('role_id', application.role_id)
        .single();
        
      if (taskError) {
        console.error('Error fetching task data:', taskError);
        throw taskError;
      }
      
      // Create the accepted_jobs record
      const { data: newAcceptedJob, error: createError } = await supabase
        .from('accepted_jobs')
        .insert({
          job_app_id: application.job_app_id,
          user_id: application.user_id,
          business_id: application.business_id,
          project_id: taskData.project_id,
          role_id: application.role_id,
          equity_agreed: taskData.equity_percentage || 0,
          jobs_equity_allocated: 0, // Start with 0 allocated
          date_accepted: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating accepted job:', createError);
        throw createError;
      }
      
      console.log('Created accepted_jobs record:', newAcceptedJob);
      
      // Update the application to mark both parties as accepted
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
        throw updateError;
      }
      
      toast.success('Job accepted! Contract generation is now available.');
      return newAcceptedJob;
      
    } catch (error) {
      console.error('Error in createAcceptedJobRecord:', error);
      toast.error('Failed to process job acceptance');
      throw error;
    }
  };

  // 🔧 NEW: Monitor for newly accepted applications and auto-process them
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
            businesses!job_applications_business_id_fkey(businesses_id)
          `)
          .eq('status', 'accepted')
          .or('accepted_business.is.null,accepted_jobseeker.is.null');
          
        if (fetchError) {
          console.error('Error fetching accepted applications:', fetchError);
          return;
        }
        
        if (acceptedApps && acceptedApps.length > 0) {
          console.log(`Found ${acceptedApps.length} accepted applications needing processing`);
          
          // Process each application
          for (const app of acceptedApps) {
            if (!app.accepted_business || !app.accepted_jobseeker) {
              console.log('Auto-processing accepted application:', app.job_app_id);
              
              const appWithBusinessId = {
                ...app,
                business_id: app.businesses?.businesses_id
              };
              
              await createAcceptedJobRecord(appWithBusinessId);
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

  // Fetch application count based on status and project filter
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
      
      // Count applications that need business action
      if (status === 'accepted') {
        // For accepted status, count applications that haven't been fully processed
        const needsProcessing = data?.filter(app => 
          !app.accepted_business || !app.accepted_jobseeker
        ).length || 0;
        
        setPendingActionCount(needsProcessing);
      } else {
        setPendingActionCount(0);
      }
    } catch (error) {
      console.error('Error counting applications:', error);
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

  // 🔧 ENHANCED: Better status descriptions
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          title: 'Pending Applications',
          description: 'Applications awaiting your review'
        };
      case 'accepted':
        return {
          title: 'Accepted Applications', 
          description: 'Applications that have been accepted. Contract generation is automatically enabled when both parties agree.'
        };
      case 'active':
        return {
          title: 'Active Applications',
          description: 'Applications with active work contracts and equity allocation in progress.'
        };
      default:
        return {
          title: 'Applications',
          description: 'View and manage applications'
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
                  ({pendingActionCount} auto-processing)
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
                {pendingActionCount > 0 && ` (${pendingActionCount} being processed)`}
              </button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
