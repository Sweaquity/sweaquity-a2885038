
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";
import { EquityProjectItem } from "./EquityProjectItem";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface EquityProjectsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const EquityProjectsList = ({ 
  applications = [],
  onApplicationUpdated = () => {}
}: EquityProjectsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { userSkills, getMatchedSkills } = useUserSkills();
  const [completedEquityProjects, setCompletedEquityProjects] = useState<JobApplication[]>([]);
  const [activeTab, setActiveTab] = useState<string>("active");

  // Separate active projects (equity not fully allocated) from completed projects (fully allocated)
  useEffect(() => {
    const fetchCompletedProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('jobseeker_active_projects')
          .select('*')
          .eq('user_id', applications[0]?.user_id || '')
          .is('application_status', 'accepted')
          .gte('equity_allocated', 'equity_agreed')
          .not('equity_agreed', 'is', null);
          
        if (error) {
          console.error("Error fetching completed equity projects:", error);
          return;
        }
        
        // Transform to JobApplication format for consistency
        const completedApps = (data || []).map(project => {
          return {
            job_app_id: project.job_app_id || '',
            user_id: project.user_id || '',
            task_id: project.task_id || '',
            project_id: project.project_id || '',
            status: 'completed',
            applied_at: project.created_at,
            accepted_business: true,
            accepted_jobseeker: true,
            business_roles: {
              title: project.ticket_title || '',
              description: project.ticket_description || '',
              company_name: '',
              project_title: project.project_title || '',
              equity_allocation: project.equity_agreed || 0,
              completion_percentage: 100,
              task_status: 'completed',
              timeframe: ''
            },
            accepted_jobs: {
              equity_agreed: project.equity_agreed || 0,
              jobs_equity_allocated: project.equity_agreed || 0,
              id: '',
              date_accepted: project.date_accepted || ''
            }
          } as JobApplication;
        });
        
        setCompletedEquityProjects(completedApps);
      } catch (err) {
        console.error("Error in fetchCompletedProjects:", err);
      }
    };
    
    if (applications.length > 0) {
      fetchCompletedProjects();
    }
  }, [applications]);

  const filteredApplications = applications.filter((application) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    // Check project title
    if (application.business_roles?.project_title && 
        String(application.business_roles.project_title).toLowerCase().includes(term)) {
      return true;
    }
    
    // Check company name
    if (application.business_roles?.company_name && 
        String(application.business_roles.company_name).toLowerCase().includes(term)) {
      return true;
    }
    
    // Check role title
    if (application.business_roles?.title && 
        String(application.business_roles.title).toLowerCase().includes(term)) {
      return true;
    }
    
    return false;
  });

  // Only show active equity projects (where equity isn't fully allocated yet)
  const activeEquityProjects = filteredApplications.filter(app => {
    const equityAgreed = app.accepted_jobs?.equity_agreed || 0;
    const equityAllocated = app.accepted_jobs?.jobs_equity_allocated || 0;
    
    // Only consider projects where equity is agreed (accepted) and not fully allocated
    return equityAgreed > 0 && equityAllocated < equityAgreed;
  });

  if (applications.length === 0 && completedEquityProjects.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">No equity projects found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search equity projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Active Equity Projects
            {activeEquityProjects.length > 0 && (
              <Badge variant="secondary" className="ml-2">{activeEquityProjects.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completed Equity Projects
            {completedEquityProjects.length > 0 && (
              <Badge variant="secondary" className="ml-2">{completedEquityProjects.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeEquityProjects.length > 0 ? (
            <div className="space-y-4">
              {activeEquityProjects.map((application) => (
                <EquityProjectItem
                  key={application.job_app_id}
                  application={application}
                  onApplicationUpdated={onApplicationUpdated}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-6">
                  <h3 className="text-lg font-medium">No Active Equity Projects</h3>
                  <p className="text-muted-foreground mt-2">
                    You don't have any active equity projects that are still in progress.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedEquityProjects.length > 0 ? (
            <div className="space-y-4">
              {completedEquityProjects.map((application) => (
                <EquityProjectItem
                  key={application.job_app_id}
                  application={application}
                  onApplicationUpdated={onApplicationUpdated}
                  isComplete={true}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-6">
                  <h3 className="text-lg font-medium">No Completed Equity Projects</h3>
                  <p className="text-muted-foreground mt-2">
                    You don't have any completed equity projects where you've earned your full equity allocation.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
