
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ConsentCheckboxesProps {
  marketingConsent: boolean;
  projectUpdatesConsent: boolean;
  termsAccepted: boolean;
  onMarketingConsentChange: (checked: boolean) => void;
  onProjectUpdatesConsentChange: (checked: boolean) => void;
  onTermsAcceptedChange: (checked: boolean) => void;
}

export const ConsentCheckboxes = ({
  marketingConsent,
  projectUpdatesConsent,
  termsAccepted,
  onMarketingConsentChange,
  onProjectUpdatesConsentChange,
  onTermsAcceptedChange
}: ConsentCheckboxesProps) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            checked={termsAccepted}
            onCheckedChange={onTermsAcceptedChange}
          />
          <Label htmlFor="terms" className="text-sm font-normal">
            I accept the terms and conditions *
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="marketing" 
            checked={marketingConsent}
            onCheckedChange={onMarketingConsentChange}
          />
          <Label htmlFor="marketing" className="text-sm font-normal">
            I agree to receive marketing emails
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="updates" 
            checked={projectUpdatesConsent}
            onCheckedChange={onProjectUpdatesConsentChange}
          />
          <Label htmlFor="updates" className="text-sm font-normal">
            I want project update notifications
          </Label>
        </div>
      </div>
    </div>
  );
};
