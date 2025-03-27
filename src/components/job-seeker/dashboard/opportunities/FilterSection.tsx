
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterSectionProps {
  onFilterChange: (filters: { search: string; sortBy: string; filterBy: string }) => void;
}

export const FilterSection = ({ onFilterChange }: FilterSectionProps) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    onFilterChange({ search: e.target.value, sortBy, filterBy });
  };

  const handleClearSearch = () => {
    setSearch('');
    onFilterChange({ search: '', sortBy, filterBy });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onFilterChange({ search, sortBy: value, filterBy });
  };

  const handleFilterChange = (value: string) => {
    setFilterBy(value);
    onFilterChange({ search, sortBy, filterBy: value });
  };

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search opportunities..."
            className="pl-8"
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-auto">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="equity-high">Highest Equity</SelectItem>
              <SelectItem value="equity-low">Lowest Equity</SelectItem>
              <SelectItem value="match-high">Best Skill Match</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-auto">
          <Select value={filterBy} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Opportunities</SelectItem>
              <SelectItem value="match">Skill Matches</SelectItem>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="high-equity">High Equity (>10%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
