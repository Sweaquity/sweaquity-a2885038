
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skill } from "@/types/jobSeeker";

export interface FilterSectionProps {
  onFilterChange: (newFilters: { search: string; sortBy: string; filterBy: string; }) => void;
  availableSkills?: Skill[];
}

export const FilterSection = ({ onFilterChange, availableSkills = [] }: FilterSectionProps) => {
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Notify parent component when filters change
    onFilterChange({ search, sortBy, filterBy });
  }, [search, sortBy, filterBy, onFilterChange]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search opportunities..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-7 w-7 p-0"
            onClick={() => setSearch("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>

        {showFilters && (
          <div className="flex space-x-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="equity">Highest Equity</SelectItem>
                <SelectItem value="match">Best Match</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="matched">Skill Matched</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {showFilters && availableSkills && availableSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Filter by skills:</h4>
          <div className="flex flex-wrap gap-2">
            {availableSkills.map((skill, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-secondary"
                onClick={() => {
                  setSearch(skill.skill);
                }}
              >
                {skill.skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
