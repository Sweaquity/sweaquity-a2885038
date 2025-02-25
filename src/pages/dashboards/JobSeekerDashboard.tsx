import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProfileSection } from "@/components/job-seeker/ProfileSection";
import { ApplicationsList } from "@/components/job-seeker/ApplicationsList";
import { EquityProjectsList } from "@/components/job-seeker/EquityProjectsList";

interface JobApplication {
  id: string;
  role_id: string;
  status: string;
  applied_at: string;
  notes: string;
  business_roles?: {
    title: string;
    description: string;
  };
}

interface EquityProject {
  id: string;
  project_id: string;
  equity_amount: number;
  time_allocated: string;
  status: string;
  start_date: string;
  end_date?: string;
  effort_logs: {
    date: string;
    hours: number;
    description: string;
  }[];
  total_hours_logged: number;
  business_roles?: {
    title: string;
    description: string;
  };
}

const JobSeekerDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [equityProjects, setEquityProjects] = useState<EquityProject[]>([]);
  const [parsedCvData, setParsedCvData] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [logEffort, setLogEffort] = useState({
    projectId: '',
    hours: 0,
    description: ''
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth/seeker');
          return;
        }

        const { data: applicationsData } = await supabase
          .from('job_applications')
          .select(`
            *,
            business_roles (
              title,
              description
            )
          `)
          .eq('user_id', session.user.id);

        if (applicationsData) {
          setApplications(applicationsData);
        }

        const { data: equityData } = await supabase
          .from('sweaquity_matched_live_projects')
          .select(`
            *,
            business_roles (
              title,
              description
            )
          `)
          .eq('user_id', session.user.id);

        if (equityData) {
          setEquityProjects(equityData);
        }

        const { data: cvData } = await supabase
          .from('cv_parsed_data')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (cvData) {
          setParsedCvData(cvData);
          setSkills(cvData.skills || []);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('cvs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cvs')
        .getPublicUrl(fileName);

      setCvUrl(publicUrl);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', session.user.id);

      const { data: parseData, error: parseError } = await supabase.functions
        .invoke('parse-cv', {
          body: formData
        });

      if (parseError) throw parseError;

      if (parseData) {
        setSkills(parseData.data.skills);
        setParsedCvData({
          ...parsedCvData,
          skills: parseData.data.skills,
          career_history: parseData.data.careerHistory,
          cv_upload_date: new Date().toISOString()
        });

        const { data: matchData, error: matchError } = await supabase.functions
          .invoke('match-opportunities', {
            body: { userId: session.user.id }
          });

        if (matchError) throw matchError;

        toast.success("CV processed and matches found");
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("Failed to upload CV");
    }
  };

  const handleLogEffort = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('sweaquity_matched_live_projects')
        .update({
          effort_logs: [...(equityProjects.find(p => p.id === projectId)?.effort_logs || []), {
            date: new Date().toISOString(),
            hours: logEffort.hours,
            description: logEffort.description
          }],
          total_hours_logged: (equityProjects.find(p => p.id === projectId)?.total_hours_logged || 0) + logEffort.hours
        })
        .eq('id', projectId);

      if (error) throw error;

      const { data: updatedProject } = await supabase
        .from('sweaquity_matched_live_projects')
        .select(`
          *,
          business_roles (
            title,
            description
          )
        `)
        .eq('id', projectId)
        .single();

      if (updatedProject) {
        setEquityProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
        setLogEffort({ projectId: '', hours: 0, description: '' });
        toast.success("Effort logged successfully");
      }

    } catch (error) {
      console.error('Error logging effort:', error);
      toast.error("Failed to log effort");
    }
  };

  const handleLogEffortChange = (projectId: string, field: 'hours' | 'description', value: string | number) => {
    setLogEffort(prev => ({
      ...prev,
      projectId,
      [field]: value
    }));
  };

  const handleSkillsUpdate = async (updatedSkills: string[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('cv_parsed_data')
        .update({ skills: updatedSkills })
        .eq('user_id', session.user.id);

      if (error) throw error;

      setSkills(updatedSkills);
    } catch (error) {
      console.error('Error updating skills:', error);
      toast.error("Failed to update skills");
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      navigate('/auth/seeker');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Job Seeker Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="equity">Current Projects</TabsTrigger>
            <TabsTrigger value="activity">Past Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Profile & Portfolio</h2>
              </CardHeader>
              <CardContent>
                <ProfileSection
                  cvUrl={cvUrl}
                  parsedCvData={parsedCvData}
                  skills={skills}
                  handleFileUpload={handleFileUpload}
                  onSkillsUpdate={handleSkillsUpdate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Relevant Opportunities</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No matching opportunities found.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsList applications={applications} />
          </TabsContent>

          <TabsContent value="equity">
            <EquityProjectsList
              projects={equityProjects}
              logEffort={logEffort}
              onLogEffort={handleLogEffort}
              onLogEffortChange={handleLogEffortChange}
            />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Past Activity</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No past activity recorded.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
