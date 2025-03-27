
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Tag } from "lucide-react";

interface FilterSectionProps {
  allSkills: string[];
  searchTerm: string;
  filterSkill: string | null;
  onSearchChange: (value: string) => void;
  onFilterSkillChange: (value: string | null) => void;
  newOpportunities?: number;
}

export const FilterSection = ({
  allSkills,
  searchTerm,
  filterSkill,
  onSearchChange,
  onFilterSkillChange,
  newOpportunities
}: FilterSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold">Available Opportunities</h2>
          {(newOpportunities && newOpportunities > 0) && (
            <Badge variant="destructive" className="ml-2">
              {newOpportunities} new
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="w-full md:w-64">
          <Select
            value={filterSkill || ""}
            onValueChange={(value) => onFilterSkillChange(value === "" ? null : value)}
          >
            <SelectTrigger>
              <div className="flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                <span>{filterSkill || "Filter by skill"}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Skills</SelectItem>
              {allSkills.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
