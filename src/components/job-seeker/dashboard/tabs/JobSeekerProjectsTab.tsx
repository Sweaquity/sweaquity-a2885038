
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LiveProjectsTab } from "@/components/business/projects/LiveProjectsTab";
import { Skeleton } from "@/components/ui/skeleton";

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab = ({ userId }: JobSeekerProjectsTabProps) => {
  const [loading, setLoading] = useState(true);
  const [hasEquityProjects, setHasEquityProjects] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      checkForEquityProjects();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const checkForEquityProjects = async () => {
    try {
      setLoading(true);
      
      // Check for accepted jobs with equity that are not fully allocated
      const { data: equityJobs, error } = await supabase
        .from('accepted_jobs')
        .select('equity_agreed, jobs_equity_allocated')
        .eq('user_id', userId)
        .gt('equity_agreed', 0);
        
      if (error) {
        throw error;
      }
      
      // Filter for jobs where equity_agreed > jobs_equity_allocated (still in progress)
      const activeEquityJobs = equityJobs.filter(job => 
        job.equity_agreed > job.jobs_equity_allocated
      );
      
      setHasEquityProjects(activeEquityJobs.length > 0);
    } catch (error) {
      console.error("Error checking for equity projects:", error);
      toast.error("Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userId) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">User Not Found</h3>
            <p className="text-muted-foreground">
              Unable to load projects. Please try signing in again.
            </p>
            <Button
              variant="default"
              className="mt-4"
              onClick={() => navigate('/auth/login')}
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasEquityProjects) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">No Active Equity Projects</h3>
            <p className="text-muted-foreground">
              You don't have any active equity projects yet. Check the Applications tab and look for equity opportunities.
            </p>
            <Button
              variant="default"
              className="mt-4"
              onClick={() => navigate('/seeker/dashboard?tab=opportunities')}
            >
              Find Opportunities
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <LiveProjectsTab businessId={userId} />;
};
