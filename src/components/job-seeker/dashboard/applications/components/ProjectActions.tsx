
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
    if (application.project_id) {
      // Navigate to the main project details page using project_id
      navigate(`/projects/${application.project_id}`, { 
        state: { application }
      });
    } else if (application.task_id) {
      // Fallback to the task ID if project ID isn't available
      navigate(`/projects/${application.task_id}`, { 
        state: { application }
      });
    } else {
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
