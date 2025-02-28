
import { Skill } from "@/types/jobSeeker";

interface JobSeekerProfile {
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  location: string | null;
  employment_preference: string | null;
  skills: Skill[];
}

interface ProfileSummaryProps {
  profile: JobSeekerProfile | null;
}

export const ProfileSummary = ({ profile }: ProfileSummaryProps) => {
  if (!profile) return null;
  
  return (
    <div className="mb-6">
      <h4 className="font-medium mb-2">Your Profile Information</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Name: </span>
          {profile.first_name} {profile.last_name}
        </div>
        <div>
          <span className="text-muted-foreground">Title: </span>
          {profile.title}
        </div>
        <div>
          <span className="text-muted-foreground">Location: </span>
          {profile.location}
        </div>
        <div>
          <span className="text-muted-foreground">Employment Preference: </span>
          {profile.employment_preference}
        </div>
      </div>
    </div>
  );
};
