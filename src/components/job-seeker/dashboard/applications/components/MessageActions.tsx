
import { Button } from '@/components/ui/button';
import { MessageSquare, ExternalLink, XCircle } from 'lucide-react';

interface MessageActionsProps {
  onMessageClick: () => void;
  projectId?: string;
  onWithdrawClick: () => void;
}

export const MessageActions = ({ 
  onMessageClick, 
  projectId, 
  onWithdrawClick 
}: MessageActionsProps) => {
  return (
    <div className="mt-4 card-actions">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onMessageClick}
        className="w-full sm:w-auto"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Send Message
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`/projects/${projectId}`, '_blank')}
        className="w-full sm:w-auto"
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        View Project
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:bg-destructive/10 w-full sm:w-auto"
        onClick={onWithdrawClick}
      >
        <XCircle className="mr-2 h-4 w-4" />
        Withdraw
      </Button>
    </div>
  );
};
