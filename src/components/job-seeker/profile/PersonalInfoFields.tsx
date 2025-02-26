
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalInfoFieldsProps {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  location: string;
  onFieldChange: (field: string, value: string) => void;
}

export const PersonalInfoFields = ({
  firstName,
  lastName,
  title,
  email,
  location,
  onFieldChange
}: PersonalInfoFieldsProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            required
            value={firstName}
            onChange={e => onFieldChange('first_name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            required
            value={lastName}
            onChange={e => onFieldChange('last_name', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Professional Title *</Label>
        <Input
          id="title"
          required
          placeholder="e.g., Senior Software Engineer"
          value={title}
          onChange={e => onFieldChange('title', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          disabled
          className="bg-muted"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          required
          placeholder="e.g., London, UK"
          value={location}
          onChange={e => onFieldChange('location', e.target.value)}
        />
      </div>
    </div>
  );
};
