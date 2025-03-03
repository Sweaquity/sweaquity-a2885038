
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ApplicationSkillsProps {
  requiredSkills: Array<string | { skill: string; level: string }>;
  matchedSkills?: string[];
}

export const ApplicationSkills = ({ 
  requiredSkills, 
  matchedSkills = [] 
}: ApplicationSkillsProps) => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return <span className="text-xs text-muted-foreground">No required skills</span>;
  }

  // Format skills for display
  const displaySkills = requiredSkills.map(skill => {
    const skillName = typeof skill === 'string' ? skill : skill.skill;
    const skillLevel = typeof skill === 'string' ? undefined : skill.level;
    
    const isMatched = matchedSkills.some(
      matched => matched.toLowerCase() === skillName.toLowerCase()
    );

    return {
      name: skillName,
      level: skillLevel,
      isMatched
    };
  });

  return (
    <div className="flex flex-wrap gap-1">
      {displaySkills.slice(0, 3).map((skill, index) => (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={skill.isMatched ? "default" : "outline"} 
                className="text-xs"
              >
                {skill.name}
                {skill.isMatched && " ✓"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{skill.name} {skill.level ? `(${skill.level})` : ''}</p>
              {skill.isMatched && <p className="text-xs">Matches your skills</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {displaySkills.length > 3 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs">
                +{displaySkills.length - 3} more
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {displaySkills.slice(3).map((skill, index) => (
                  <p key={index}>
                    {skill.name} {skill.level ? `(${skill.level})` : ''}
                    {skill.isMatched && " ✓"}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
