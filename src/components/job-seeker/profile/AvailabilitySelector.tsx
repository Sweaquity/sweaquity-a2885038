
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const AVAILABILITY_OPTIONS = [
  'Immediately available',
  '2 weeks notice',
  'Part time',
  'Ad hoc',
  'Outside of usual business hours',
  'Curious to which projects require my skills'
] as const;

interface AvailabilitySelectorProps {
  selected: string;
  onSelect: (value: string) => void;
}

export const AvailabilitySelector = ({
  selected,
  onSelect
}: AvailabilitySelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="availability">Availability *</Label>
      <div className="grid grid-cols-2 gap-2">
        {AVAILABILITY_OPTIONS.map((option) => (
          <Button
            key={option}
            type="button"
            variant={selected === option ? "default" : "outline"}
            className="justify-start"
            onClick={() => onSelect(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};
