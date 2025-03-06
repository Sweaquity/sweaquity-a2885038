
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteProfileDialog } from "./DeleteProfileDialog";
import { MarketingPreferencesDialog } from "./MarketingPreferencesDialog";

interface AccountSettingsCardProps {
  userType: 'business' | 'job_seeker';
}

export const AccountSettingsCard = ({ userType }: AccountSettingsCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMarketingDialogOpen, setIsMarketingDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-base font-semibold">Marketing Preferences</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Manage how we communicate with you
            </p>
            <Button
              variant="outline"
              onClick={() => setIsMarketingDialogOpen(true)}
              className="w-full"
            >
              Update Marketing Preferences
            </Button>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-base font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Delete your account and all your data
            </p>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="w-full md:w-auto"
            >
              Delete My Account
            </Button>
          </div>
        </div>
        
        <DeleteProfileDialog 
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          userType={userType}
        />
        
        <MarketingPreferencesDialog
          isOpen={isMarketingDialogOpen}
          onClose={() => setIsMarketingDialogOpen(false)}
          userType={userType}
        />
      </CardContent>
    </Card>
  );
};
