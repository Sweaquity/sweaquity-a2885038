
import { Badge } from "@/components/ui/badge";
import { Skill } from "@/types/jobSeeker";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { X, ChevronDown } from "lucide-react";

interface SkillBadgeProps {
  skill: Skill;
  onRemove: () => void;
  onLevelChange: (level: "Beginner" | "Intermediate" | "Expert") => void;
}

export const SkillBadge = ({ skill, onRemove, onLevelChange }: SkillBadgeProps) => {
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
      <button
        onClick={onRemove}
        className="rounded-full p-1 hover:bg-gray-200 transition-colors"
        title="Remove skill"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
