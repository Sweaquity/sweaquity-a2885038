
import React from "react";
import { PendingApplicationItem } from "./PendingApplicationItem";
import { JobApplication } from "@/types/jobSeeker";
import { PendingApplicationsListProps } from "@/types/types";

export const PendingApplicationsList: React.FC<PendingApplicationsListProps> = ({
  applications,
  onWithdraw,
  onAccept,
  isWithdrawing
}) => {
  const sortedApplications = [...applications].sort((a, b) => {
    // Sort by application date, newest first
    const dateA = a.applied_at ? new Date(a.applied_at).getTime() : 0;
    const dateB = b.applied_at ? new Date(b.applied_at).getTime() : 0;
    return dateB - dateA;
  });

  // Get matched skills for an application
  const getMatchedSkills = (application: JobApplication) => {
    // For job applications, skill requirements may be in different places
    let requiredSkills: string[] = [];
    let applicantSkills: string[] = [];
    
    // Try to get skill requirements from business_roles
    if (application.business_roles?.skill_requirements) {
      const skillReqs = application.business_roles.skill_requirements;
      if (Array.isArray(skillReqs)) {
        requiredSkills = skillReqs.map((sk: any) => {
          if (typeof sk === 'string') return sk;
          if (sk && typeof sk === 'object' && sk.skill) return sk.skill;
          return '';
        }).filter(Boolean);
      }
    }
    
    // Directly assigned skills_required (from a join query)
    if (application.skills_required && Array.isArray(application.skills_required)) {
      requiredSkills = [
        ...new Set([
          ...requiredSkills,
          ...application.skills_required.map((sk: any) => {
            if (typeof sk === 'string') return sk;
            if (sk && typeof sk === 'object' && sk.skill) return sk.skill;
            return '';
          }).filter(Boolean)
        ])
      ];
    }
    
    // Applicant skills
    if (application.applicant_skills && Array.isArray(application.applicant_skills)) {
      applicantSkills = application.applicant_skills.map((sk: any) => {
        if (typeof sk === 'string') return sk;
        if (sk && typeof sk === 'object' && sk.skill) return sk.skill;
        return '';
      }).filter(Boolean);
    }
    
    // Find the intersection
    const matchedSkills = requiredSkills.filter(skill => 
      applicantSkills.some(appSkill => 
        appSkill.toLowerCase() === skill.toLowerCase()
      )
    );
    
    return {
      matched: matchedSkills,
      total: requiredSkills.length,
      matchPercentage: requiredSkills.length 
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100) 
        : 0
    };
  };

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending applications.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedApplications.map((application) => (
        <PendingApplicationItem
          key={application.job_app_id}
          application={application}
          onAccept={onAccept || (() => Promise.resolve())}
          onWithdraw={onWithdraw || (() => Promise.resolve())}
          isWithdrawing={isWithdrawing || false}
          getMatchedSkills={() => getMatchedSkills(application)}
        />
      ))}
    </div>
  );
};
