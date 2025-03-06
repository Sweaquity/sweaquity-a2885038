
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TermsAndConditionsLink } from "@/components/shared/TermsAndConditionsLink";

interface ConsentCheckboxesProps {
  marketingConsent: boolean;
  projectUpdatesConsent: boolean;
  termsAccepted: boolean;
  onMarketingConsentChange: (checked: boolean) => void;
  onProjectUpdatesConsentChange: (checked: boolean) => void;
  onTermsAcceptedChange: (checked: boolean) => void;
  // For backward compatibility with existing code
  onConsentChange?: (field: string, value: boolean) => void;
}

export const ConsentCheckboxes = ({
  marketingConsent,
  projectUpdatesConsent,
  termsAccepted,
  onMarketingConsentChange,
  onProjectUpdatesConsentChange,
  onTermsAcceptedChange,
  onConsentChange
}: ConsentCheckboxesProps) => {
  // Handle both direct and field-based consent changes
  const handleTermsChange = (checked: boolean) => {
    onTermsAcceptedChange(checked);
    if (onConsentChange) onConsentChange('terms_accepted', checked);
  };

  const handleMarketingChange = (checked: boolean) => {
    onMarketingConsentChange(checked);
    if (onConsentChange) onConsentChange('marketing_consent', checked);
  };

  const handleUpdatesChange = (checked: boolean) => {
    onProjectUpdatesConsentChange(checked);
    if (onConsentChange) onConsentChange('project_updates_consent', checked);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            checked={termsAccepted}
            onCheckedChange={handleTermsChange}
          />
          <Label htmlFor="terms" className="text-sm font-normal">
            I accept the <TermsAndConditionsLink /> *
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="marketing" 
            checked={marketingConsent}
            onCheckedChange={handleMarketingChange}
          />
          <Label htmlFor="marketing" className="text-sm font-normal">
            I agree to receive marketing emails
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="updates" 
            checked={projectUpdatesConsent}
            onCheckedChange={handleUpdatesChange}
          />
          <Label htmlFor="updates" className="text-sm font-normal">
            I want project update notifications
          </Label>
        </div>
      </div>
    </div>
  );
};
