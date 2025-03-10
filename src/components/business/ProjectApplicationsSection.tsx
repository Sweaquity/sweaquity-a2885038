
import React, { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Application } from "@/types/business";
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

  const projectId = project?.project_id;

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
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select(`
          job_app_id,
          created_at,
          status,
          notes,
          message,
          task_id,
          project_id,
          user_id,
          applied_at,
          cv_url,
          task_discourse,
          accepted_business,
          accepted_jobseeker,
          business_roles (
            business_role_id,
            title,
            description,
            skill_requirements,
            equity_allocation,
            timeframe,
            project_title
          ),
          profiles (
            id,
            first_name,
            last_name,
            headline,
            skills,
            experience,
            education,
            title,
            location,
            employment_preference
          )
        `)
        .eq('project_id', project?.project_id || '');

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError);
        setError(`Failed to fetch applications: ${applicationsError.message}`);
        return;
      }

      if (applicationsData) {
        // Transform the data to match Application type
        const transformedApplications: Application[] = applicationsData.map(app => ({
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
          business_roles: Array.isArray(app.business_roles) && app.business_roles.length > 0 
            ? app.business_roles[0] 
            : {
                title: "Untitled Role",
                description: "",
                skill_requirements: [],
                equity_allocation: 0,
                timeframe: ""
              },
          profile: app.profiles && app.profiles.length > 0
            ? {
                first_name: app.profiles[0]?.first_name || "",
                last_name: app.profiles[0]?.last_name || "",
                title: app.profiles[0]?.title || app.profiles[0]?.headline || "",
                location: app.profiles[0]?.location || "",
                employment_preference: app.profiles[0]?.employment_preference || "",
                skills: app.profiles[0]?.skills || []
              }
            : {
                first_name: "",
                last_name: "",
                title: "",
                location: "",
                employment_preference: ""
              }
        }));

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
      project_id: project?.project_id || null
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
