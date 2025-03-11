
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useProfile } from "@/hooks/job-seeker/useProfile";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountSettingsCard } from "@/components/shared/AccountSettingsCard";
import { ProfileEditor } from "@/components/job-seeker/profile/ProfileEditor";
import { SkillsCard } from "@/components/job-seeker/skills/SkillsCard";
import { CVLibrary } from "@/components/job-seeker/cv/CVLibrary";
import { CareerHistoryDisplay } from "@/components/job-seeker/career/CareerHistoryDisplay";

export const ProfileTab = () => {
  const { profile, isLoading, error, refetch } = useProfile();
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsProfileComplete(
        !!profile.full_name &&
        !!profile.location &&
        !!profile.summary &&
        !!profile.terms_accepted
      );
    }
  }, [profile]);

  const handleProfileUpdate = async () => {
    await refetch();
    toast.success("Profile updated successfully");
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-800">
        <p>Error loading profile: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Profile Information</h2>
        </CardHeader>
        <CardContent>
          {profile ? (
            <ProfileEditor 
              profileData={profile} 
              onProfileUpdate={handleProfileUpdate} 
            />
          ) : (
            <p className="text-muted-foreground">Profile not found. Please complete your profile.</p>
          )}
        </CardContent>
      </Card>

      <SkillsCard />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CVLibrary />
        <CareerHistoryDisplay />
      </div>
      
      <AccountSettingsCard userType="job_seeker" />
    </div>
  );
};
