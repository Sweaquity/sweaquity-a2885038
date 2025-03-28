
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface FilterSectionProps {
  allSkills: string[];
  searchTerm: string;
  filterSkill: string | null;
  onSearchChange: (value: string) => void;
  onFilterSkillChange: (skill: string | null) => void;
}

export const FilterSection = ({
  allSkills,
  searchTerm,
  filterSkill,
  onSearchChange,
  onFilterSkillChange,
}: FilterSectionProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
      <div className="w-full md:w-1/2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, companies or skills..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="w-full md:w-auto flex flex-wrap gap-2">
        {allSkills.slice(0, 5).map((skill, index) => (
          <Badge
            key={index}
            variant={filterSkill === skill ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onFilterSkillChange(filterSkill === skill ? null : skill)}
          >
            {skill}
          </Badge>
        ))}
        {allSkills.length > 5 && (
          <Badge variant="outline" className="cursor-pointer" onClick={() => {}}>
            +{allSkills.length - 5} more
          </Badge>
        )}
      </div>
    </div>
  );
};
