
import React, { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Application, Project } from "@/types/business";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ActiveApplicationsTable } from './applications/tables/ActiveApplicationsTable';
import { ArchivedApplicationsTable } from './applications/tables/ArchivedApplicationsTable';
import { AcceptJobDialog } from './applications/AcceptJobDialog';

interface ProjectApplicationsSectionProps {
  project?: Project; // Make project optional since it's not always available
}

export const ProjectApplicationsSection = ({ project }: ProjectApplicationsSectionProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeApplications, setActiveApplications] = useState<Application[]>([]);
  const [archivedApplications, setArchivedApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());
  const [acceptJobDialogOpen, setAcceptJobDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const toggleApplicationExpanded = (id: string) => {
    setExpandedApplications((prevExpanded) => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Modified query to first get the job applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select(`
          job_app_id,
          task_id,
          user_id,
          applied_at,
          created_at,
          status,
          notes,
          message,
          cv_url,
          task_discourse,
          accepted_business,
          accepted_jobseeker,
          project_id
        `)
        .eq('project_id', project?.project_id || '');

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError);
        setError(`Failed to fetch applications: ${applicationsError.message}`);
        return;
      }

      if (applicationsData) {
        // Now get the associated profiles and business roles separately
        const jobApps = [...applicationsData];
        
        // Get list of user IDs from applications
        const userIds = jobApps.map(app => app.user_id).filter(Boolean);
        
        // Get profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, title, location, employment_preference, skills')
          .in('id', userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          setError(`Failed to fetch profiles: ${profilesError.message}`);
          return;
        }

        // Get list of task IDs from applications
        const taskIds = jobApps.map(app => app.task_id).filter(Boolean);
        
        // Get business roles for these tasks
        const { data: rolesData, error: rolesError } = await supabase
          .from('project_sub_tasks')
          .select('task_id, title, description, skill_requirements, equity_allocation, timeframe, project_id')
          .in('task_id', taskIds);

        if (rolesError) {
          console.error("Error fetching business roles:", rolesError);
          setError(`Failed to fetch business roles: ${rolesError.message}`);
          return;
        }

        // Create a map for quick lookup
        const profilesMap = profilesData?.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>) || {};

        const rolesMap = rolesData?.reduce((acc, role) => {
          acc[role.task_id] = role;
          return acc;
        }, {} as Record<string, any>) || {};

        // Transform the data to match Application type
        const transformedApplications: Application[] = jobApps.map(app => {
          const profile = profilesMap[app.user_id] || {};
          const role = rolesMap[app.task_id] || {};
          
          return {
            id: app.job_app_id, // Add id as an alias of job_app_id
            job_app_id: app.job_app_id,
            task_id: app.task_id,
            user_id: app.user_id,
            applied_at: app.applied_at,
            status: app.status,
            message: app.message || '',
            cv_url: app.cv_url,
            task_discourse: app.task_discourse,
            accepted_business: app.accepted_business,
            accepted_jobseeker: app.accepted_jobseeker,
            notes: app.notes,
            project_id: app.project_id,
            business_roles: {
              title: role.title || "Untitled Role",
              description: role.description || "",
              skill_requirements: role.skill_requirements || [],
              equity_allocation: role.equity_allocation || 0,
              timeframe: role.timeframe || "",
              project_title: role.project_title || ""
            },
            profile: {
              first_name: profile.first_name || "",
              last_name: profile.last_name || "",
              title: profile.title || "",
              location: profile.location || "",
              employment_preference: profile.employment_preference || "",
              skills: profile.skills || []
            }
          };
        });

        setApplications(transformedApplications);
        setActiveApplications(transformedApplications.filter(app => app.status === 'active'));
        setArchivedApplications(transformedApplications.filter(app => app.status !== 'active'));
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [project?.project_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('job_app_id', id);

      if (error) {
        console.error("Error updating application status:", error);
        toast.error(`Failed to update application status: ${error.message}`);
        return;
      }

      toast.success("Application status updated successfully!");
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error("Error updating application status:", err);
      toast.error(`An unexpected error occurred: ${err.message}`);
    }
  };

  const onApplicationUpdate = async () => {
    await fetchData();
  };

  const openAcceptJobDialog = async (application: Application) => {
    // Make sure application has the project_id property
    const jobApp = {
      ...application,
      project_id: project?.project_id || application.project_id || null
    };
    
    setSelectedApplication(jobApp);
    setAcceptJobDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading applications...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Tabs defaultValue="active" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="archived">Archived</TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <ActiveApplicationsTable
          applications={activeApplications}
          expandedApplications={expandedApplications}
          toggleApplicationExpanded={toggleApplicationExpanded}
          onApplicationUpdate={onApplicationUpdate}
          handleStatusChange={handleStatusChange}
          openAcceptJobDialog={openAcceptJobDialog}
        />
      </TabsContent>
      <TabsContent value="archived">
        <ArchivedApplicationsTable
          applications={archivedApplications}
          expandedApplications={expandedApplications}
          toggleApplicationExpanded={toggleApplicationExpanded}
          onApplicationUpdate={onApplicationUpdate}
          handleStatusChange={handleStatusChange}
        />
      </TabsContent>
      
      {selectedApplication && (
        <AcceptJobDialog
          isOpen={acceptJobDialogOpen}
          onOpenChange={setAcceptJobDialogOpen}
          application={selectedApplication}
          onAccept={onApplicationUpdate}
        />
      )}
    </Tabs>
  );
};
