
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FilterSectionProps {
  onFilterChange: (filters: any) => void;
  availableSkills: string[];
}

export const FilterSection = ({ onFilterChange, availableSkills = [] }: FilterSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [equityRange, setEquityRange] = useState([0, 100]);
  const [timeCommitment, setTimeCommitment] = useState<string>("any");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    applyFilters({ searchQuery: e.target.value });
  };

  const handleSkillSelect = (skill: string) => {
    const updatedSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(updatedSkills);
    applyFilters({ selectedSkills: updatedSkills });
  };

  const handleEquityRangeChange = (value: number[]) => {
    setEquityRange(value);
    applyFilters({ equityRange: value });
  };

  const handleTimeCommitmentChange = (value: string) => {
    setTimeCommitment(value);
    applyFilters({ timeCommitment: value });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSkills([]);
    setEquityRange([0, 100]);
    setTimeCommitment("any");
    applyFilters({
      searchQuery: "",
      selectedSkills: [],
      equityRange: [0, 100],
      timeCommitment: "any"
    });
  };

  const applyFilters = (changedFilters: any) => {
    const filters = {
      searchQuery: changedFilters.searchQuery !== undefined ? changedFilters.searchQuery : searchQuery,
      selectedSkills: changedFilters.selectedSkills || selectedSkills,
      equityRange: changedFilters.equityRange || equityRange,
      timeCommitment: changedFilters.timeCommitment || timeCommitment
    };
    onFilterChange(filters);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-shrink-0">
              Filters
              {(selectedSkills.length > 0 || timeCommitment !== "any" || equityRange[0] > 0 || equityRange[1] < 100) && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {selectedSkills.length + (timeCommitment !== "any" ? 1 : 0) + (equityRange[0] > 0 || equityRange[1] < 100 ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                  Clear all
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Required Skills</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {availableSkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`skill-${skill}`} 
                        checked={selectedSkills.includes(skill)}
                        onCheckedChange={() => handleSkillSelect(skill)}
                      />
                      <Label htmlFor={`skill-${skill}`} className="text-sm">{skill}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Equity Range (%)</Label>
                <div className="pt-4">
                  <Slider 
                    defaultValue={[0, 100]} 
                    max={100} 
                    step={1} 
                    value={equityRange}
                    onValueChange={handleEquityRangeChange}
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{equityRange[0]}%</span>
                    <span>{equityRange[1]}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Time Commitment</Label>
                <Select value={timeCommitment} onValueChange={handleTimeCommitmentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time commitment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any commitment</SelectItem>
                    <SelectItem value="short">Short term (&lt;1 month)</SelectItem>
                    <SelectItem value="medium">Medium term (1-3 months)</SelectItem>
                    <SelectItem value="long">Long term (3+ months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-2">
                <Button onClick={() => setShowFilters(false)} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map(skill => (
            <Badge key={skill} variant="secondary" className="flex items-center gap-1">
              {skill}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleSkillSelect(skill)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
