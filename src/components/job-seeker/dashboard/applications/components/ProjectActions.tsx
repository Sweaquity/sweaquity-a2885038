
import { Button } from '@/components/ui/button';
import { MessageCircle, ExternalLink } from 'lucide-react';

interface ProjectActionsProps {
  onMessageClick: () => void;
  onViewProjectClick: () => void;
}

export const ProjectActions = ({ 
  onMessageClick, 
  onViewProjectClick 
}: ProjectActionsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <Button 
        variant="default" 
        size="sm" 
        onClick={onMessageClick}
      >
        <MessageCircle className="mr-1.5 h-4 w-4" />
        Create Message
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={onViewProjectClick}
      >
        <ExternalLink className="mr-1.5 h-4 w-4" />
        View Project
      </Button>
    </div>
  );
};
