
import { Badge } from "@/components/ui/badge";
import { Skill } from "@/types/jobSeeker";

interface SkillBadgeProps {
  skill: Skill;
  onRemove?: () => void;
  onLevelChange?: (level: "Beginner" | "Intermediate" | "Expert") => void;
  isUserSkill?: boolean;
}

export const SkillBadge = ({ skill, onRemove, onLevelChange, isUserSkill }: SkillBadgeProps) => {
  // Import these only if they are needed for the editable version
  const DropdownMenu = onLevelChange ? require("@/components/ui/dropdown-menu").DropdownMenu : null;
  const DropdownMenuContent = onLevelChange ? require("@/components/ui/dropdown-menu").DropdownMenuContent : null;
  const DropdownMenuItem = onLevelChange ? require("@/components/ui/dropdown-menu").DropdownMenuItem : null;
  const DropdownMenuTrigger = onLevelChange ? require("@/components/ui/dropdown-menu").DropdownMenuTrigger : null;
  const ChevronDown = onLevelChange ? require("lucide-react").ChevronDown : null;
  const X = onRemove ? require("lucide-react").X : null;

  const getColorByLevel = () => {
    switch (skill.level) {
      case "Beginner":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Intermediate":
        return "bg-green-100 text-green-800 border-green-200";
      case "Expert":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // If we're just displaying the skill (no edit functionality)
  if (!onRemove && !onLevelChange) {
    return (
      <Badge
        variant="outline"
        className={`${isUserSkill ? getColorByLevel() : "bg-gray-100 text-gray-800 border-gray-200"}`}
      >
        {skill.skill}{isUserSkill ? ` (${skill.level})` : ""}
      </Badge>
    );
  }

  // If we're displaying an editable skill
  return (
    <div className="inline-flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge
            variant="outline"
            className={`${getColorByLevel()} cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1`}
          >
            {skill.skill} ({skill.level})
            <ChevronDown className="h-3 w-3 ml-1" />
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onLevelChange("Beginner")}>
            Beginner
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLevelChange("Intermediate")}>
            Intermediate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLevelChange("Expert")}>
            Expert
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {onRemove && (
        <button
          onClick={onRemove}
          className="rounded-full p-1 hover:bg-gray-200 transition-colors"
          title="Remove skill"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
