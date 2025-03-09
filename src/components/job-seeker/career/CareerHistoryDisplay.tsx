
import { Skill } from "@/types/jobSeeker";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Briefcase, GraduationCap } from "lucide-react";

interface CareerHistoryDisplayProps {
  careerHistory: any[];
  skills?: Skill[];
  education?: any[];
}

export const CareerHistoryDisplay = ({ 
  careerHistory = [], 
  skills = [],
  education = []
}: CareerHistoryDisplayProps) => {
  // Filter skills to business and project management categories
  const businessSkills = skills.filter(skill => {
    const skillName = typeof skill === 'string' ? skill : skill.skill;
    return (
      skillName.toLowerCase().includes('project') || 
      skillName.toLowerCase().includes('business') ||
      skillName.toLowerCase().includes('management') ||
      skillName.toLowerCase().includes('leadership') ||
      skillName.toLowerCase().includes('strategy')
    );
  });

  return (
    <div className="space-y-6">
      {careerHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Professional Experience</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {careerHistory.map((job, index) => (
              <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{job.title || 'Position'}</h4>
                    <p className="text-sm text-muted-foreground">{job.company || 'Company'}</p>
                  </div>
                  <div className="flex items-center mt-1 md:mt-0">
                    <CalendarClock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm">
                      {job.start_date || 'Start'} - {job.end_date || 'Present'}
                    </span>
                  </div>
                </div>
                {job.description && (
                  <p className="text-sm mt-2">{job.description}</p>
                )}
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.skills.map((skill: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {businessSkills.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Business & Management Skills</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {businessSkills.map((skill, index) => (
                <Badge key={index} className="text-sm">
                  {typeof skill === 'string' ? skill : skill.skill}
                  {typeof skill !== 'string' && skill.level && 
                    <span className="ml-1 opacity-70">({skill.level})</span>
                  }
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {education && education.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <GraduationCap className="mr-2 h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Education</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{edu.degree || 'Degree'}</h4>
                    <p className="text-sm text-muted-foreground">{edu.institution || 'Institution'}</p>
                  </div>
                  <div className="flex items-center mt-1 md:mt-0">
                    <CalendarClock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm">
                      {edu.start_date || 'Start'} - {edu.end_date || 'Graduation'}
                    </span>
                  </div>
                </div>
                {edu.field_of_study && (
                  <p className="text-sm">Field: {edu.field_of_study}</p>
                )}
                {edu.description && (
                  <p className="text-sm mt-1">{edu.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
