import { useLocation } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/job-seeker/ProfileSection";
import { ProfileCompletionForm } from "@/components/job-seeker/ProfileCompletionForm";
import { ApplicationsList } from "@/components/job-seeker/ApplicationsList";
import { EquityProjectsList } from "@/components/job-seeker/EquityProjectsList";
import { DashboardHeader } from "@/components/job-seeker/dashboard/DashboardHeader";
import { useJobSeekerDashboard } from "@/hooks/useJobSeekerDashboard";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const JobSeekerDashboard = () => {
  const location = useLocation();
  const activeTabFromState = location.state?.activeTab || "profile";
  
  const {
    isLoading,
    profile,
    cvUrl,
    applications,
    equityProjects,
    parsedCvData,
    skills,
    logEffort,
    setLogEffort,
    handleSignOut,
    handleSkillsUpdate,
    setCvUrl,
    setParsedCvData,
    setEquityProjects
  } = useJobSeekerDashboard();

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
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

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
        setParsedCvData({
          ...parsedCvData,
          skills: parseData.data.skills || [],
          career_history: parseData.data.careerHistory || [],
          cv_upload_date: new Date().toISOString()
        });

        const newSkills = parseData.data.skills || [];
        await handleSkillsUpdate(newSkills);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("Failed to upload CV");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!profile?.first_name || !profile?.last_name || !profile?.title) {
    return <ProfileCompletionForm />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <DashboardHeader profile={profile} onSignOut={handleSignOut} />

          <Tabs defaultValue={activeTabFromState} className="space-y-6">
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
                  <h2 className="text-lg font-semibold">Matched Skills Projects</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {equityProjects.map(project => (
                      <div key={project.id} className="border p-4 rounded-lg hover:bg-secondary/50 transition-colors">
                        <a href={`/projects/${project.id}`} className="block">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <p className="font-medium">Company/Project</p>
                              <p>{project.business_roles?.title}</p>
                            </div>
                            <div>
                              <p className="font-medium">Timeframe</p>
                              <p>{project.time_allocated}</p>
                            </div>
                            <div>
                              <p className="font-medium">Equity Available</p>
                              <p>{project.equity_amount}%</p>
                            </div>
                            <div>
                              <p className="font-medium">Project Value</p>
                              <p>TBD</p>
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                    {equityProjects.length === 0 && (
                      <p className="text-muted-foreground">No matching opportunities found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Projects that you've applied for</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications.map(application => (
                      <div key={application.id} className="border p-4 rounded-lg hover:bg-secondary/50 transition-colors">
                        <a href={`/projects/${application.role_id}`} className="block">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <p className="font-medium">Company/Project</p>
                              <p>{application.business_roles?.title}</p>
                            </div>
                            <div>
                              <p className="font-medium">Status</p>
                              <p className="capitalize">{application.status}</p>
                            </div>
                            <div>
                              <p className="font-medium">Applied Date</p>
                              <p>{new Date(application.applied_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="font-medium">Project Value</p>
                              <p>TBD</p>
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <p className="text-muted-foreground">No applications found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="equity">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Projects that you're eligible for equity in</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {equityProjects.map(project => (
                      <div key={project.id} className="border p-4 rounded-lg">
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="font-medium">Company/Project</p>
                            <p>{project.business_roles?.title}</p>
                          </div>
                          <div>
                            <p className="font-medium">Total Hours</p>
                            <p>{project.total_hours_logged || 0}</p>
                          </div>
                          <div>
                            <p className="font-medium">Equity Earned</p>
                            <p>{project.equity_amount}%</p>
                          </div>
                          <div>
                            <p className="font-medium">Project Value</p>
                            <p>TBD</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <button onClick={() => handleLogEffort(project.id)}>Log Effort</button>
                          <input
                            type="number"
                            value={logEffort.hours}
                            onChange={(e) => handleLogEffortChange(project.id, 'hours', e.target.value)}
                            placeholder="Hours"
                          />
                          <input
                            type="text"
                            value={logEffort.description}
                            onChange={(e) => handleLogEffortChange(project.id, 'description', e.target.value)}
                            placeholder="Description"
                          />
                        </div>
                      </div>
                    ))}
                    {equityProjects.length === 0 && (
                      <p className="text-muted-foreground">No active equity projects found.</p>
                    )}
                  </div>
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
    </div>
  );
};

export default JobSeekerDashboard;
