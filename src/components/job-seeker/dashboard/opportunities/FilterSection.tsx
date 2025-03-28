
import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Bell } from 'lucide-react';

interface FilterSectionProps {
  allSkills: string[];
  searchTerm: string;
  filterSkill: string | null;
  onSearchChange: (value: string) => void;
  onFilterSkillChange: (value: string | null) => void;
  newOpportunities?: number;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  allSkills,
  searchTerm,
  filterSkill,
  onSearchChange,
  onFilterSkillChange,
  newOpportunities
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Available Opportunities</h2>
        {newOpportunities && (
          <div className="flex items-center">
            <Bell className="h-4 w-4 mr-1 text-blue-500" />
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {newOpportunities} new
            </Badge>
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            type="search"
            placeholder="Search opportunities..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <Select
          value={filterSkill || ""}
          onValueChange={(value) => onFilterSkillChange(value || null)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by skill" />
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
  );
};
