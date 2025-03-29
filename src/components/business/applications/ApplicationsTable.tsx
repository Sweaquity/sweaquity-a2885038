
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
  useEffect(() => {
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
        
        // Count applications that need business action - they are accepted but business hasn't accepted yet
        if (status === 'accepted') {
          const pendingAction = data?.filter(app => 
            !app.accepted_business && app.accepted_jobseeker
          ).length || 0;
          
          setPendingActionCount(pendingAction);
        } else {
          setPendingActionCount(0);
        }
      } catch (error) {
        console.error('Error counting applications:', error);
      } finally {
        setLoading(false);
      }
    };
    
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="text-lg font-semibold mb-1">
            {status === 'pending' 
              ? 'Pending Applications' 
              : status === 'active' 
                ? 'Active Applications' 
                : 'Completed Applications'}
            <Badge variant="secondary" className="ml-2">
              {applicationCount}
              {pendingActionCount > 0 && (
                <span className="ml-1 text-red-500 font-bold">(+{pendingActionCount} need attention)</span>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {status === 'pending' 
              ? 'Applications awaiting your review' 
              : status === 'active' 
                ? 'When both users (jobseeker and business) agree on the terms both are required to accept, which will then allow the user to work on the tasks and as the tasks are completed the equity allocation is reviewed in the Live Projects tab.'
                : 'Applications that have been completed or rejected'}
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
              {status === 'pending' 
                ? 'No pending applications found' 
                : status === 'active' 
                  ? 'No active applications found' 
                  : 'No completed applications found'}
              {projectFilter && ' for this project'}
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
                {pendingActionCount > 0 && ` (${pendingActionCount} need attention)`}
              </button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
