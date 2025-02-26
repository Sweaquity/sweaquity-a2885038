
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JobApplication } from "@/types/jobSeeker";
import { toast } from "sonner";

export const useApplications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [pastApplications, setPastApplications] = useState<JobApplication[]>([]);

  const loadApplications = async (userId: string) => {
    try {
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          business_roles:project_sub_tasks (
            title,
            description,
            timeframe,
            skills_required,
            equity_allocation,
            project:business_projects (
              title,
              business:businesses (
                company_name
              )
            )
          ),
          profile:profiles (
            first_name,
            last_name,
            title,
            location,
            employment_preference,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (applicationsError) throw applicationsError;

      const currentApps = applicationsData?.filter(app => app.status !== 'withdrawn') || [];
      const pastApps = applicationsData?.filter(app => app.status === 'withdrawn') || [];

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
