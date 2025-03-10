import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketingPreferencesDialog } from "./MarketingPreferencesDialog";
import { DeleteProfileDialog } from "./DeleteProfileDialog";
import { TermsAndConditionsLink } from "./TermsAndConditionsLink";

interface AccountSettingsCardProps {
  userType: 'business' | 'job_seeker';
}

export const AccountSettingsCard = ({ userType }: AccountSettingsCardProps) => {
  const [isMarketingDialogOpen, setIsMarketingDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const openMarketingDialog = () => setIsMarketingDialogOpen(true);
  const closeMarketingDialog = () => setIsMarketingDialogOpen(false);
  
  const openDeleteDialog = () => setIsDeleteDialogOpen(true);
  const closeDeleteDialog = () => setIsDeleteDialogOpen(false);

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 items-center">
          <div>
            <h3 className="text-lg font-medium">Marketing Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Control how we communicate with you
            </p>
          </div>
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={openMarketingDialog}
            >
              Manage Preferences
            </Button>
          </div>
          
          <div className="pt-4 border-t col-span-2" />
          
          <div>
            <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end">
            <Button 
              variant="destructive" 
              onClick={openDeleteDialog}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start border-t pt-4">
          <p className="text-sm text-muted-foreground">
            By using our platform, you agree to our <TermsAndConditionsLink />
          </p>
        </CardFooter>
      </Card>

      {/* Dialogs */}
      <MarketingPreferencesDialog 
        isOpen={isMarketingDialogOpen}
        onClose={closeMarketingDialog}
        userType={userType}
      />
      
      <DeleteProfileDialog 
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        userType={userType}
      />
    </>
  );
};
