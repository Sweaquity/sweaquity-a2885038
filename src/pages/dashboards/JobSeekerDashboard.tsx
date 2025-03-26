
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { MoreVertical, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Profile, EquityProject } from "@/types/jobSeeker";
import { DashboardTab } from "@/components/job-seeker/dashboard/tabs/DashboardTab";
import { ApplicationsTab } from "@/components/job-seeker/dashboard/tabs/ApplicationsTab";
import { JobSeekerProjectsTab } from "@/components/job-seeker/dashboard/tabs/JobSeekerProjectsTab";
import { OpportunitiesTab } from "@/components/job-seeker/dashboard/tabs/OpportunitiesTab";

const JobSeekerDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [equityProjects, setEquityProjects] = useState<EquityProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchProfile(user.id);
        await fetchEquityProjects(user.id);
      } else {
        navigate('/login');
      }
    };

    getCurrentUser();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      }

      setProfile(data || null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchEquityProjects = async (userId: string) => {
    try {
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          business_roles (
            title,
            description,
            company_name,
            project_title
          )
        `)
        .eq('user_id', userId)
        .not('business_roles', 'is', null);

      if (error) {
        console.error("Error fetching equity projects:", error);
        toast.error("Failed to load equity projects");
      }

      // Convert job applications to equity projects for compatibility
      const projects = (data || []).map(app => ({
        id: app.job_app_id,
        project_id: app.project_id,
        job_app_id: app.job_app_id,
        equity_amount: app.accepted_jobs?.equity_agreed || 0,
        time_allocated: '',
        status: app.status,
        start_date: app.applied_at,
        applied_at: app.applied_at,
        business_roles: app.business_roles,
        created_by: app.user_id,
        effort_logs: [],
        total_hours_logged: 0
      }));

      setEquityProjects(projects);
    } catch (error) {
      console.error("Error fetching equity projects:", error);
      toast.error("Failed to load equity projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6 mt-2" />
            <Skeleton className="h-6 w-1/2 mt-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="text-center">
            <p>Could not load profile information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedProjects = [...equityProjects].sort((a, b) => {
    // Use applied_at or start_date if updated_at isn't available
    const dateA = a.applied_at ? new Date(a.applied_at) : a.start_date ? new Date(a.start_date) : new Date(0);
    const dateB = b.applied_at ? new Date(b.applied_at) : b.start_date ? new Date(b.start_date) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={`https://avatar.vercel.sh/${profile.first_name + profile.last_name}.png`} />
                <AvatarFallback>{profile.first_name?.[0]}{profile.last_name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">{profile.first_name} {profile.last_name}</h2>
                <p className="text-sm text-muted-foreground">{profile.title || 'Job Seeker'}</p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
              <p className="text-sm">Email: {profile.email}</p>
              <p className="text-sm">Location: {profile.location}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Skills</h3>
              <ul className="list-disc pl-4">
                {profile.skills?.map((skill, index) => (
                  <li key={index} className="text-sm">{skill.skill} ({skill.level})</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <DashboardTab 
            activeTab="dashboard"
            profile={profile}
            cvUrl=""
            parsedCvData={null}
            onUpdateProfile={() => {}}
            onUploadCV={() => Promise.resolve()}
            isUploading={false}
            skills={[]}
            onSkillsUpdate={() => {}}
            equityProjects={equityProjects}
          />
        </TabsContent>
        <TabsContent value="applications">
          <ApplicationsTab 
            applications={equityProjects}
            onApplicationUpdated={() => fetchEquityProjects(profile.id || '')}
          />
        </TabsContent>
        <TabsContent value="projects">
          <JobSeekerProjectsTab userId={profile.id || ''} />
        </TabsContent>
        <TabsContent value="opportunities">
          <OpportunitiesTab 
            projects={[]}
            userSkills={[]}
          />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Active Equity Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProjects ? (
            <p>Loading active equity projects...</p>
          ) : sortedProjects.length === 0 ? (
            <p>No active equity projects found.</p>
          ) : (
            <Accordion type="single" collapsible>
              {sortedProjects.map((project) => (
                <AccordionItem key={project.id} value={project.id}>
                  <AccordionTrigger>
                    <div className="flex justify-between w-full">
                      <span>{project.business_roles?.project_title || 'Untitled Project'}</span>
                      <Badge variant="secondary">
                        {project.status}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Role</h4>
                        <p className="text-sm">{project.business_roles?.title}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Company</h4>
                        <p className="text-sm">{project.business_roles?.company_name}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Description</h4>
                        <p className="text-sm">{project.business_roles?.description}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Applied At</h4>
                        <p className="text-sm">{new Date(project.applied_at || project.start_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="ml-auto flex h-8 w-8 p-0 data-[state=open]:bg-muted">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => {
                          navigator.clipboard.writeText(project.id);
                          toast.success("Project ID copied to clipboard");
                        }}>
                          Copy Project ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobSeekerDashboard;
