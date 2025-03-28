
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { JobApplication } from '@/types/jobSeeker';

interface ProjectActionsProps {
  application: JobApplication;
  onSendMessage?: () => void;
}

export const ProjectActions = ({ application, onSendMessage }: ProjectActionsProps) => {
  const navigate = useNavigate();
  
  const handleViewProject = () => {
    // First try to use project_id directly from the application
    if (application.project_id) {
      navigate(`/projects/${application.project_id}`);
    } 
    // Next try to use the project_id from the business_roles object
    else if (application.business_roles?.project_id) {
      navigate(`/projects/${application.business_roles.project_id}`);
    }
    // Finally fall back to task_id if neither project ID is available
    else if (application.task_id) {
      navigate(`/projects/${application.task_id}`);
    } 
    else {
      toast.error("Project details not available");
    }
  };
  
  const handleSendMessage = () => {
    if (onSendMessage) {
      onSendMessage();
    } else {
      toast.info("Messaging feature coming soon");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleSendMessage}>
        <MessageSquare className="h-4 w-4 mr-1" />
        Send Message
      </Button>
      <Button variant="outline" size="sm" onClick={handleViewProject}>
        <Eye className="h-4 w-4 mr-1" />
        View Project
      </Button>
    </div>
  );
};
