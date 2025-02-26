
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/job-seeker/ProfileSection";
import { OpportunitiesTab } from "./OpportunitiesTab";
import { ApplicationsTab } from "./ApplicationsTab";
import { EquityTab } from "./EquityTab";
import { JobApplication, EquityProject, Skill } from "@/types/jobSeeker";

interface DashboardContentProps {
  activeTab: string;
  cvUrl: string | null;
  parsedCvData: any;
  skills: Skill[];
  applications: JobApplication[];
  equityProjects: EquityProject[];
  availableOpportunities: EquityProject[];
  logEffort: {
    projectId: string;
    hours: number;
    description: string;
  };
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSkillsUpdate: (skills: Skill[]) => void;
  onLogEffort: (projectId: string) => void;
  onLogEffortChange: (projectId: string, field: 'hours' | 'description', value: string | number) => void;
}

export const DashboardContent = ({
  activeTab,
  cvUrl,
  parsedCvData,
  skills,
  applications,
  equityProjects,
  availableOpportunities,
  logEffort,
  handleFileUpload,
  onSkillsUpdate,
  onLogEffort,
  onLogEffortChange
}: DashboardContentProps) => {
  return (
    <Tabs defaultValue={activeTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        <TabsTrigger value="applications">Applications</TabsTrigger>
        <TabsTrigger value="equity">Current Projects</TabsTrigger>
        <TabsTrigger value="activity">Past Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Profile & Portfolio</h2>
          </CardHeader>
          <CardContent>
            <ProfileSection
              cvUrl={cvUrl}
              parsedCvData={parsedCvData}
              skills={skills}
              handleFileUpload={handleFileUpload}
              onSkillsUpdate={onSkillsUpdate}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="opportunities">
        <OpportunitiesTab 
          projects={availableOpportunities} 
          userSkills={skills}
        />
      </TabsContent>

      <TabsContent value="applications">
        <ApplicationsTab applications={applications} />
      </TabsContent>

      <TabsContent value="equity">
        <EquityTab
          projects={equityProjects}
          logEffort={logEffort}
          onLogEffort={onLogEffort}
          onLogEffortChange={onLogEffortChange}
        />
      </TabsContent>

      <TabsContent value="activity">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Past Activity</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No past activity recorded.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
