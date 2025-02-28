
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JobApplication } from "@/types/jobSeeker";
import { toast } from "sonner";

export const useApplications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [pastApplications, setPastApplications] = useState<JobApplication[]>([]);

  const loadApplications = async (userId: string) => {
    try {
      // Simplify the query to avoid foreign key relationship issues
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          business_roles:project_sub_tasks (
            *,
            project:business_projects (
              *,
              business:businesses (
                company_name
              )
            )
          )
        `)
        .eq('user_id', userId);

      if (applicationsError) throw applicationsError;

      // Map job_app_id to id for backward compatibility
      const transformedData = applicationsData?.map(app => ({
        ...app,
        // Ensure both job_app_id and id are set
        id: app.job_app_id,
        job_app_id: app.job_app_id
      }));

      const currentApps = transformedData?.filter(app => app.status !== 'withdrawn') || [];
      const pastApps = transformedData?.filter(app => app.status === 'withdrawn') || [];

      const transformApplications = (apps: any[]) => apps.map(app => ({
        ...app,
        business_roles: {
          ...app.business_roles,
          company_name: app.business_roles?.project?.business?.company_name,
          project_title: app.business_roles?.project?.title,
        }
      }));

      setApplications(transformApplications(currentApps));
      setPastApplications(transformApplications(pastApps));
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error("Failed to load applications");
    }
  };

  return { applications, pastApplications, loadApplications };
};
