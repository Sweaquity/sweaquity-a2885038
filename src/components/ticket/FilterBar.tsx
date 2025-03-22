
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FilterBarProps {
  activeFilter: string;
  sortCriteria: string;
  onFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  sortCriteria,
  onFilterChange,
  onSortChange
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="space-x-2">
        <Button 
          variant={activeFilter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => onFilterChange('all')}
        >
          All
        </Button>
        <Button 
          variant={activeFilter === 'open' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => onFilterChange('open')}
        >
          Open
        </Button>
        <Button 
          variant={activeFilter === 'closed' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => onFilterChange('closed')}
        >
          Closed
        </Button>
        <Button 
          variant={activeFilter === 'high' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => onFilterChange('high')}
        >
          High Priority
        </Button>
      </div>
      
      <div className="ml-auto">
        <Select
          value={sortCriteria}
          onValueChange={onSortChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FilterBar;
