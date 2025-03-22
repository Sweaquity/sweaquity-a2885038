
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FilterBarProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  dueDateFilter: string;
  setDueDateFilter: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  dueDateFilter,
  setDueDateFilter,
  searchQuery,
  setSearchQuery,
  onClearFilters
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h3 className="text-sm font-medium mb-3">Filter Tickets</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="status-filter" className="text-xs block mb-1">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-full">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="priority-filter" className="text-xs block mb-1">Priority</Label>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger id="priority-filter" className="w-full">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
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
            <Button variant="outline" size="sm" onClick={onClearFilters} className="whitespace-nowrap">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
