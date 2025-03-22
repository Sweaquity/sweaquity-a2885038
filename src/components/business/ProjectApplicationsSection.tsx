
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface JobApplication {
  job_app_id: string;
  project_id: string;
  user_id: string;
  task_id: string;
  status: string;
  applied_at: string;
  notes: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  business_projects?: {
    title: string;
  };
  project_sub_tasks?: {
    title: string;
  };
}

export const ProjectApplicationsSection = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptedApplications, setAcceptedApplications] = useState<JobApplication[]>([]);
  const [pendingApplications, setPendingApplications] = useState<JobApplication[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<JobApplication[]>([]);
  const [withdrawnApplications, setWithdrawnApplications] = useState<JobApplication[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Not authenticated");
        return;
      }

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          job_app_id,
          project_id,
          user_id,
          task_id,
          status,
          applied_at,
          notes,
          profiles (
            first_name,
            last_name
          ),
          business_projects (
            title
          ),
          project_sub_tasks (
            title
          )
        `)
        .eq('business_id', session.user.id)
        .order('applied_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Transform the data to match the JobApplication interface
        const processedData: JobApplication[] = data.map((item: any) => ({
          job_app_id: item.job_app_id,
          project_id: item.project_id,
          user_id: item.user_id,
          task_id: item.task_id,
          status: item.status,
          applied_at: item.applied_at,
          notes: item.notes,
          // Convert nested arrays to single objects
          profiles: item.profiles && item.profiles.length > 0 ? item.profiles[0] : undefined,
          business_projects: item.business_projects && item.business_projects.length > 0 ? item.business_projects[0] : undefined,
          project_sub_tasks: item.project_sub_tasks && item.project_sub_tasks.length > 0 ? item.project_sub_tasks[0] : undefined
        }));
        
        setApplications(processedData);
        setAcceptedApplications(processedData.filter(app => app.status === 'accepted'));
        setPendingApplications(processedData.filter(app => app.status === 'pending'));
        setRejectedApplications(processedData.filter(app => app.status === 'rejected'));
        setWithdrawnApplications(processedData.filter(app => app.status === 'withdrawn'));
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch applications");
      toast.error(err.message || "Failed to fetch applications");
    } finally {
      setIsLoading(false);
    }
  };

  const getFormattedDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date", error);
      return "Invalid Date";
    }
  };

  const getAcceptedApplications = () => {
    return acceptedApplications || [];
  };

  const getPendingApplications = () => {
    return pendingApplications || [];
  };

  const getRejectedApplications = () => {
    return rejectedApplications || [];
  };

  const getWithdrawnApplications = () => {
    return withdrawnApplications || [];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Applications</CardTitle>
        <CardDescription>
          Here's an overview of all applications to your projects.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading applications...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <div className="grid gap-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Accepted Applications</h3>
              {getAcceptedApplications().length === 0 ? (
                <p className="text-muted-foreground">No accepted applications found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getAcceptedApplications().map((app) => (
                      <TableRow key={app.job_app_id}>
                        <TableCell>{app.profiles?.first_name} {app.profiles?.last_name}</TableCell>
                        <TableCell>{app.business_projects?.title}</TableCell>
                        <TableCell>{app.project_sub_tasks?.title}</TableCell>
                        <TableCell>{getFormattedDate(app.applied_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{app.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Pending Applications</h3>
              {getPendingApplications().length === 0 ? (
                <p className="text-muted-foreground">No pending applications found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPendingApplications().map((app) => (
                      <TableRow key={app.job_app_id}>
                        <TableCell>{app.profiles?.first_name} {app.profiles?.last_name}</TableCell>
                        <TableCell>{app.business_projects?.title}</TableCell>
                        <TableCell>{app.project_sub_tasks?.title}</TableCell>
                        <TableCell>{getFormattedDate(app.applied_at)}</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">{app.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Rejected Applications</h3>
              {getRejectedApplications().length === 0 ? (
                <p className="text-muted-foreground">No rejected applications found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getRejectedApplications().map((app) => (
                      <TableRow key={app.job_app_id}>
                        <TableCell>{app.profiles?.first_name} {app.profiles?.last_name}</TableCell>
                        <TableCell>{app.business_projects?.title}</TableCell>
                        <TableCell>{app.project_sub_tasks?.title}</TableCell>
                        <TableCell>{getFormattedDate(app.applied_at)}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">{app.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Withdrawn Applications</h3>
              {getWithdrawnApplications().length === 0 ? (
                <p className="text-muted-foreground">No withdrawn applications found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getWithdrawnApplications().map((app) => (
                      <TableRow key={app.job_app_id}>
                        <TableCell>{app.profiles?.first_name} {app.profiles?.last_name}</TableCell>
                        <TableCell>{app.business_projects?.title}</TableCell>
                        <TableCell>{app.project_sub_tasks?.title}</TableCell>
                        <TableCell>{getFormattedDate(app.applied_at)}</TableCell>
                        <TableCell>
                          <Badge className="bg-gray-100 text-gray-800">{app.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
