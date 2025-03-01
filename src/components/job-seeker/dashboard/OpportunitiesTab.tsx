
import React, { useState } from "react";
import { ProjectCard } from "@/components/job-seeker/dashboard/ProjectCard";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { OpportunityMatch } from "@/hooks/useJobSeekerDashboard";
import { EmptyState } from "@/components/job-seeker/dashboard/applications/EmptyState";

interface OpportunitiesTabProps {
  matchedProjects: OpportunityMatch[];
  isLoading: boolean;
}

export const OpportunitiesTab: React.FC<OpportunitiesTabProps> = ({
  matchedProjects,
  isLoading,
}) => {
  const [matchThreshold, setMatchThreshold] = useState([0]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading opportunities...</p>
      </div>
    );
  }

  if (!matchedProjects || matchedProjects.length === 0) {
    return (
      <EmptyState
        title="No matching opportunities found"
        description="As you add more skills to your profile, we'll show you projects that match your expertise."
        icon="search"
      />
    );
  }

  const filteredProjects = matchedProjects.filter(
    (project) => project.score >= matchThreshold[0]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="match-slider">Match threshold: {matchThreshold[0]}%</Label>
        </div>
        <Slider
          id="match-slider"
          min={0}
          max={100}
          step={5}
          value={matchThreshold}
          onValueChange={setMatchThreshold}
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No opportunities match your selected threshold. Try lowering the match percentage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
            />
          ))}
        </div>
      )}
    </div>
  );
};
