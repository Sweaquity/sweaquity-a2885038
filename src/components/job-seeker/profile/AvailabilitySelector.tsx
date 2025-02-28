
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

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

  return (
    <div className="space-y-3">
      <Label htmlFor="availability">Availability *</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {AVAILABILITY_OPTIONS.map((option) => (
          <div 
            key={option}
            onClick={() => handleSelect(option)}
            className={`
              cursor-pointer rounded-md p-3 flex items-start gap-3
              border transition-all
              ${selected.includes(option) 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'}
            `}
          >
            <div className={`
              flex-shrink-0 w-5 h-5 rounded-sm mt-0.5
              border flex items-center justify-center
              ${selected.includes(option) 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'border-muted-foreground'}`
            }>
              {selected.includes(option) && <Check className="h-3.5 w-3.5" />}
            </div>
            <span className="text-sm">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
