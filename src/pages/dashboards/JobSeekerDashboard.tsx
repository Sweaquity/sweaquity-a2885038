
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth/seeker');
          return;
        }

        // Load job applications
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

        // Load equity projects
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

        // Load CV parsed data
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

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cvs')
        .getPublicUrl(fileName);

      setCvUrl(publicUrl);
      toast.success("CV uploaded successfully");

      // TODO: Integrate with CV parsing service
      // For now, we'll just update the UI
      toast.success("CV uploaded successfully. Processing...");

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("Failed to upload CV");
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="cv">CV & Portfolio</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="equity">Current Equity</TabsTrigger>
            <TabsTrigger value="activity">Past Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Profile & Skills</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <div key={index} className="bg-secondary px-3 py-1 rounded-full text-sm">
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cv">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">CV & Portfolio Management</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cv-upload">Upload CV</Label>
                    <Input
                      id="cv-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                  </div>
                  {cvUrl && (
                    <div className="space-y-2">
                      <p className="font-medium">Current CV</p>
                      <Button asChild variant="outline">
                        <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                          View CV
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
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
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Current Applications</h2>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="border p-4 rounded-lg">
                        <h3 className="font-medium">{application.business_roles?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Status: {application.status}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Applied: {new Date(application.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No current applications.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equity">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Current Equity Positions</h2>
              </CardHeader>
              <CardContent>
                {equityProjects.length > 0 ? (
                  <div className="space-y-4">
                    {equityProjects.map((project) => (
                      <div key={project.id} className="border p-4 rounded-lg">
                        <h3 className="font-medium">{project.business_roles?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Equity Amount: {project.equity_amount}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Time Allocated: {project.time_allocated}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Status: {project.status}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No current equity positions.</p>
                )}
              </CardContent>
            </Card>
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
