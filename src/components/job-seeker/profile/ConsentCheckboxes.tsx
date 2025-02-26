
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ConsentCheckboxesProps {
  termsAccepted: boolean;
  marketingConsent: boolean;
  projectUpdatesConsent: boolean;
  onConsentChange: (field: string, value: boolean) => void;
}

export const ConsentCheckboxes = ({
  termsAccepted,
  marketingConsent,
  projectUpdatesConsent,
  onConsentChange
}: ConsentCheckboxesProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(checked: boolean) => onConsentChange('terms_accepted', checked)}
        />
        <Label htmlFor="terms" className="text-sm">
          I accept the <a 
            href="/terms" 
            target="_blank" 
            className="text-primary hover:underline"
            onClick={(e) => {
              e.preventDefault();
              window.open('/terms', '_blank');
            }}
          >terms and conditions</a>, and agree to having my data collected *
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="marketing"
          checked={marketingConsent}
          onCheckedChange={(checked: boolean) => onConsentChange('marketing_consent', checked)}
        />
        <Label htmlFor="marketing" className="text-sm">
          I agree to receive marketing communications
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="updates"
          checked={projectUpdatesConsent}
          onCheckedChange={(checked: boolean) => onConsentChange('project_updates_consent', checked)}
        />
        <Label htmlFor="updates" className="text-sm">
          I want to receive project updates
        </Label>
      </div>
    </div>
  );
};
