
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PendingApplicationItem } from './PendingApplicationItem';
import { JobApplication } from '@/types/applications';

export interface PendingApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  onAccept?: (application: JobApplication) => Promise<void>;
  isWithdrawing?: boolean;
}

export const PendingApplicationsList = ({
  applications,
  onApplicationUpdated = () => {},
  onWithdraw,
  onAccept,
  isWithdrawing = false
}: PendingApplicationsListProps) => {
  // Helper function to count matched skills
  const getMatchedSkills = (application: JobApplication) => {
    // Check if we have skill data directly on the application
    const projectSkills = application.skills_required || 
                          (application.business_roles?.skill_requirements?.map(s => 
                            typeof s === 'string' ? s : s.skill) || []);
    
    const applicantSkills = application.applicant_skills || [];
    
    if (!projectSkills.length || !applicantSkills.length) {
      return [];
    }
    
    return projectSkills.filter(skill => 
      applicantSkills.some(applicantSkill => 
        typeof applicantSkill === 'string' && typeof skill === 'string' &&
        applicantSkill.toLowerCase() === skill.toLowerCase()
      )
    );
  };
  
  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <h3 className="text-lg font-medium">No Pending Applications</h3>
            <p className="text-muted-foreground mt-2">
              You don't have any pending applications at the moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort applications - those needing acceptance first, then by date
  const sortedApplications = [...applications].sort((a, b) => {
    // Applications awaiting job seeker acceptance come first
    if (a.status === 'accepted' && a.accepted_business && !a.accepted_jobseeker) {
      return -1;
    }
    if (b.status === 'accepted' && b.accepted_business && !b.accepted_jobseeker) {
      return 1;
    }
    
    // Then sort by date (newest first)
    const dateA = a.applied_at ? new Date(a.applied_at).getTime() : 0;
    const dateB = b.applied_at ? new Date(b.applied_at).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-4">
      {sortedApplications.map(application => (
        <PendingApplicationItem
          key={application.job_app_id || application.id || `app-${Math.random()}`}
          application={application}
          onAccept={onAccept}
          onWithdraw={onWithdraw}
          isWithdrawing={isWithdrawing}
          getMatchedSkills={() => getMatchedSkills(application)}
          onApplicationUpdated={onApplicationUpdated}
        />
      ))}
    </div>
  );
};
