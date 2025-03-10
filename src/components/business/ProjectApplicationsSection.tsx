import React, { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Project, Application } from "@/types/business";
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
            skill_requirements
          ),
          profiles (
            id,
            first_name,
            last_name,
            headline,
            skills,
            experience,
            education
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
          business_roles: app.business_roles,
          profile: app.profiles[0] || null
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
    // Convert Application type to JobApplication type if needed
    // We need to provide any missing required properties from JobApplication type
    const jobApp = {
      ...application,
      // Add any required properties that might be missing
      project_id: application.projectId || null, // Assuming projectId exists in Application
      // Add any other required fields from JobApplication type that are missing in Application
    };
    
    setSelectedApplication(application);
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
          open={acceptJobDialogOpen}
          onOpenChange={setAcceptJobDialogOpen}
          application={selectedApplication}
          onAccept={onApplicationUpdate}
        />
      )}
    </Tabs>
  );
};
