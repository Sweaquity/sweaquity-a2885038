
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { RefreshCw, ExternalLink } from "lucide-react";

const ProjectsOverview = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to view projects");
        return;
      }

      const { data, error } = await supabase
        .from('jobseeker_active_projects')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Projects Overview</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadProjects} 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No active projects found.</p>
          </div>
        ) : (
          <ResizablePanelGroup direction="vertical" className="min-h-[400px]">
            <ResizablePanel defaultSize={50}>
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{project.company_name?.charAt(0) || 'P'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{project.title || 'Unnamed Project'}</h3>
                              <p className="text-sm text-muted-foreground">{project.company_name || 'Unknown Company'}</p>
                            </div>
                          </div>
                          <Badge>{project.status || 'Active'}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{project.completion_percentage || 0}%</span>
                          </div>
                          <Progress value={project.completion_percentage || 0} className="h-2" />
                          <div className="flex justify-between mt-4">
                            <Button variant="outline" size="sm">
                              Details
                            </Button>
                            <Button size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Go to Project
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50}>
              <Tabs defaultValue="details">
                <div className="p-4">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="mt-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-muted-foreground">Select a project to view details</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="activity" className="mt-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-muted-foreground">Select a project to view activity</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsOverview;
