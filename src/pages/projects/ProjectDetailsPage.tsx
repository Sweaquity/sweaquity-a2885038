
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ActiveRolesTable } from "@/components/business/roles/ActiveRolesTable";

interface Business {
  company_name: string;
  project_stage: string;
  contact_email: string;
  industry: string;
  website: string;
  location: string;
}

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  skills_required: string[];
  project_timeframe: string;
  business_id: string;
  tasks: any[];
  business: Business;
}

export const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [hasStoredCV, setHasStoredCV] = useState(false);
  const [storedCVUrl, setStoredCVUrl] = useState<string | null>(null);
  const [newCV, setNewCV] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          toast.error("Please sign in to view project details");
          return;
        }

        const { data: taskData, error: taskError } = await supabase
          .from('project_sub_tasks')
          .select('*')
          .eq('id', id)
          .single();

        if (taskError) throw taskError;

        // Check if user has already applied
        const { data: applicationData } = await supabase
          .from('job_applications')
          .select('*')
          .eq('task_id', id)
          .eq('user_id', session.user.id)
          .single();

        setHasApplied(!!applicationData);

        // Check for stored CV
        const { data: cvData } = await supabase
          .from('cv_parsed_data')
          .select('cv_url')
          .eq('user_id', session.user.id)
          .single();

        if (cvData?.cv_url) {
          setHasStoredCV(true);
          setStoredCVUrl(cvData.cv_url);
        }

        setProject({
          id: taskData.id,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          equity_allocation: taskData.equity_allocation,
          skills_required: taskData.skills_required || [],
          project_timeframe: taskData.timeframe,
          business_id: taskData.project_id,
          tasks: [taskData],
          business: {
            company_name: "Project Owner",
            project_stage: "",
            contact_email: "",
            industry: "",
            website: "",
            location: ""
          }
        });
      } catch (error) {
        console.error('Error fetching project details:', error);
        toast.error("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("File size should be less than 10MB");
        return;
      }
      setNewCV(file);
    }
  };

  const handleApply = async () => {
    if (!applicationMessage.trim()) {
      toast.error("Please provide an application message");
      return;
    }

    if (!hasStoredCV && !newCV) {
      toast.error("Please attach a CV");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("Please sign in to apply");
        return;
      }

      let cvUrl = storedCVUrl;

      // If a new CV is being uploaded
      if (newCV) {
        const fileName = `${session.user.id}/${Date.now()}-${newCV.name}`;
        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(fileName, newCV);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cvs')
          .getPublicUrl(fileName);

        cvUrl = publicUrl;
      }

      // Create the application
      const { error: applicationError } = await supabase
        .from('job_applications')
        .insert({
          user_id: session.user.id,
          task_id: id,
          message: applicationMessage,
          cv_url: cvUrl,
          status: 'pending'
        });

      if (applicationError) throw applicationError;

      toast.success("Application submitted successfully");
      setHasApplied(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <p className="text-muted-foreground">{project.business.company_name}</p>
            </div>
            <Badge variant="outline">{project.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="roles">Available Roles</TabsTrigger>
              <TabsTrigger value="apply">Apply</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Project Information</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-muted-foreground">Description</dt>
                        <dd>{project.description}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Timeframe</dt>
                        <dd>{project.project_timeframe}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Equity Available</dt>
                        <dd>{project.equity_allocation}%</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Required Skills</dt>
                        <dd className="flex flex-wrap gap-1 mt-1">
                          {project.skills_required.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="roles">
              <ActiveRolesTable project={project} />
            </TabsContent>

            <TabsContent value="apply">
              <div className="space-y-4">
                {hasApplied ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-green-800">
                      You have already applied for this opportunity. We'll notify you of any updates.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>CV Upload</Label>
                      <div className="space-y-4">
                        {hasStoredCV && (
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="stored-cv"
                              name="cv-choice"
                              defaultChecked
                              onChange={() => setNewCV(null)}
                            />
                            <Label htmlFor="stored-cv">Use stored CV</Label>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            id="new-cv"
                            name="cv-choice"
                            onChange={() => setStoredCVUrl(null)}
                          />
                          <div className="space-y-2">
                            <Label htmlFor="new-cv">Upload new CV</Label>
                            <Input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileChange}
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Application Message</Label>
                      <Textarea
                        placeholder="Tell us why you're interested in this opportunity and how your skills match the requirements..."
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                        className="min-h-[200px]"
                        disabled={isSubmitting}
                      />
                    </div>

                    <Button 
                      onClick={handleApply}
                      disabled={isSubmitting || (!hasStoredCV && !newCV) || !applicationMessage.trim()}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
