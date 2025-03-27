import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Cross, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { JobApplication } from '@/types/jobSeeker';

interface PendingApplicationsListProps {
  applications: JobApplication[];
  onWithdraw?: (applicationId: string) => void;
  onStatusChange?: (applicationId: string, newStatus: string) => void;
}

// Inside the PendingApplicationsList component
export const PendingApplicationsList = ({ 
  applications,
  onWithdraw,
  onStatusChange
}: PendingApplicationsListProps) => {
  
  // Fix the getSkills function to always require an application argument
  const getSkills = (application: JobApplication): string[] => {
    if (!application) return [];
    
    // Try to extract skills from the application data
    let skills: string[] = [];
    
    if (application.sub_task && application.sub_task.skill_requirements) {
      if (Array.isArray(application.sub_task.skill_requirements)) {
        skills = application.sub_task.skill_requirements.map(skill => {
          if (typeof skill === 'string') return skill;
          if (typeof skill === 'object' && skill && skill.skill) {
            return typeof skill.skill === 'string' ? skill.skill : '';
          }
          return '';
        }).filter(Boolean);
      }
    }
    
    return skills;
  };
  
  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <div key={application.id} className="border rounded-md p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{application.project_title}</h3>
              <p className="text-sm text-muted-foreground">
                Task: {application.task_title}
              </p>
              <p className="text-sm text-muted-foreground">
                Applied on: {new Date(application.created_at).toLocaleDateString()}
              </p>
              <div className="mt-2">
                {application.status === 'pending' && (
                  <Badge variant="secondary">Pending</Badge>
                )}
                {application.status === 'accepted' && (
                  <Badge variant="success">Accepted</Badge>
                )}
                {application.status === 'rejected' && (
                  <Badge variant="destructive">Rejected</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {application.status === 'pending' && onWithdraw && (
                <Button variant="outline" size="sm" onClick={() => onWithdraw(application.id)}>
                  Withdraw
                </Button>
              )}
              {application.status === 'accepted' && application.accepted_business && !application.accepted_jobseeker && onStatusChange && (
                <>
                  <Button variant="outline" size="sm" onClick={() => onStatusChange(application.id, 'accepted_jobseeker')}>
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onStatusChange(application.id, 'rejected_jobseeker')}>
                    <Cross className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" asChild>
                <a href={`/projects/${application.project_id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Project
                </a>
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium">Skills Required</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {getSkills(application).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ))}
      {applications.length === 0 && (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No pending applications.</p>
        </div>
      )}
    </div>
  );
};
