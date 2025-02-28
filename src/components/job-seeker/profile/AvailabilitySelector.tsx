
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const AVAILABILITY_OPTIONS = [
  'Immediately available',
  '2 weeks notice',
  'Part time',
  'Ad hoc',
  'Outside of usual business hours',
  'Curious to which projects require my skills'
] as const;

interface AvailabilitySelectorProps {
  selected: string[];
  onSelect: (value: string[]) => void;
}

export const AvailabilitySelector = ({
  selected,
  onSelect
}: AvailabilitySelectorProps) => {
  const handleSelect = (option: string) => {
    if (selected.includes(option)) {
      onSelect(selected.filter(item => item !== option));
    } else {
      onSelect([...selected, option]);
    }
  };

  const handleRemove = (option: string) => {
    onSelect(selected.filter(item => item !== option));
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="availability">Availability *</Label>
      
      {/* Display selected options as badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((option) => (
            <Badge key={option} variant="secondary" className="pl-3 pr-2 py-1.5 flex items-center gap-1">
              {option}
              <button 
                type="button" 
                onClick={() => handleRemove(option)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Selection options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {AVAILABILITY_OPTIONS.map((option) => (
          <Button
            key={option}
            type="button"
            variant={selected.includes(option) ? "default" : "outline"}
            size="sm"
            className="justify-start text-left h-auto py-2 px-3"
            onClick={() => handleSelect(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};
