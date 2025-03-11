
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useProfile } from "@/hooks/job-seeker/useProfile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountSettingsCard } from "@/components/shared/AccountSettingsCard";
import { ProfileEditor } from "@/components/job-seeker/profile/ProfileEditor";
import { SkillsCard } from "@/components/job-seeker/skills/SkillsCard";
import { CVLibrary } from "@/components/job-seeker/cv/CVLibrary";
import { CareerHistoryDisplay } from "@/components/job-seeker/career/CareerHistoryDisplay";
import { supabase } from "@/lib/supabase";

export const ProfileTab = ({ profile, cvUrl, skills, parsedCvData, onSkillsUpdate, userCVs, onCvListUpdated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (profile) {
      // Check if profile values exist
      setIsProfileComplete(
        !!profile.first_name &&
        !!profile.last_name &&
        !!profile.location &&
        !!profile.bio && // Using bio instead of summary
        !!profile.terms_accepted
      );
    }
  }, [profile]);

  const handleProfileUpdate = async () => {
    toast.success("Profile updated successfully");
    try {
      // Get the latest profile data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error refreshing profile data:", error);
    }
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

  if (loadError) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-800">
        <p>Error loading profile: {loadError}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
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

      {skills && (
        <SkillsCard 
          skills={skills}
          onSkillsUpdate={onSkillsUpdate}
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {userCVs && (
          <CVLibrary 
            userCVs={userCVs}
            onCvListUpdated={onCvListUpdated} 
            processingAction={false}
            onSetDefault={() => {}}
            onPreview={() => {}}
            onDelete={() => {}}
          />
        )}
        
        {parsedCvData?.career_history && (
          <CareerHistoryDisplay 
            careerHistory={parsedCvData.career_history}
            skills={skills || []}
            education={parsedCvData.education || []}
          />
        )}
      </div>
      
      <AccountSettingsCard userType="job_seeker" />
    </div>
  );
};
