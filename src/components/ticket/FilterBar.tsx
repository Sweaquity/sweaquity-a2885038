
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FilterBarProps {
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  priorityFilter?: string;
  setPriorityFilter?: (priority: string) => void;
  dueDateFilter?: string;
  setDueDateFilter?: (date: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onClearFilters?: () => void;
  // Add the new prop for compatibility with LiveProjectsTab
  onFilterChange?: (newFilters: any) => void;
  // Add the arrays for statuses and priorities
  statuses?: string[];
  priorities?: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter = "all",
  setStatusFilter = () => {},
  priorityFilter = "all",
  setPriorityFilter = () => {},
  dueDateFilter = "",
  setDueDateFilter = () => {},
  searchQuery = "",
  setSearchQuery = () => {},
  onClearFilters = () => {},
  onFilterChange,
  statuses = ['all', 'new', 'in-progress', 'blocked', 'review', 'done', 'closed'],
  priorities = ['all', 'low', 'medium', 'high']
}) => {
  const [filters, setFilters] = useState({
    status: statusFilter,
    priority: priorityFilter
  });

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    // Call the new onFilterChange prop if it exists
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handlePriorityChange = (priority: string) => {
    setPriorityFilter(priority);
    const newFilters = { ...filters, priority };
    setFilters(newFilters);
    // Call the new onFilterChange prop if it exists
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setDueDateFilter("");
    setSearchQuery("");
    onClearFilters();
    
    const newFilters = { status: "all", priority: "all" };
    setFilters(newFilters);
    // Call the new onFilterChange prop if it exists
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h3 className="text-sm font-medium mb-3">Filter Tickets</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="status-filter" className="text-xs block mb-1">Status</Label>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger id="status-filter" className="w-full">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>{status === 'all' ? 'All Statuses' : status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="priority-filter" className="text-xs block mb-1">Priority</Label>
          <Select value={priorityFilter} onValueChange={handlePriorityChange}>
            <SelectTrigger id="priority-filter" className="w-full">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>{priority === 'all' ? 'All Priorities' : priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="due-date-filter" className="text-xs block mb-1">Due Date</Label>
          <Input
            id="due-date-filter"
            type="date"
            value={dueDateFilter}
            onChange={(e) => setDueDateFilter(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div>
          <Label htmlFor="search-query" className="text-xs block mb-1">Search</Label>
          <div className="flex gap-2">
            <Input
              id="search-query"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="whitespace-nowrap">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
