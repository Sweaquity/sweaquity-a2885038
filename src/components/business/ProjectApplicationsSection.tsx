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
  project: Project;
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

  const projectId = project.project_id;

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
        .eq('project_id', projectId);

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError);
        setError(`Failed to fetch applications: ${applicationsError.message}`);
        return;
      }

      if (applicationsData) {
        const typedApplications = applicationsData as Application[];
        setApplications(typedApplications);
        setActiveApplications(typedApplications.filter(app => app.status === 'active'));
        setArchivedApplications(typedApplications.filter(app => app.status !== 'active'));
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

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

  const onApplicationUpdate = () => {
    fetchData();
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
