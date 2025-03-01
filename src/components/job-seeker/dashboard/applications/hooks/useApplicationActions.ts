
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useApplicationActions = (onApplicationUpdated?: () => void) => {
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async (applicationId: string) => {
    try {
      setIsWithdrawing(applicationId);
      setError(null);
      
      console.log(`Attempting to withdraw application with ID: ${applicationId}`);
      
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const msg = "You must be logged in to withdraw an application";
        console.error(msg);
        setError(msg);
        toast.error(msg);
        return;
      }
      
      // Update the application status to "withdrawn"
      const { data, error } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn' })
        .eq('job_app_id', applicationId)
        .eq('user_id', session.user.id) // Ensure the user can only withdraw their own applications
        .select();
      
      if (error) {
        console.error("Error withdrawing application:", error);
        setError(error.message);
        toast.error(`Failed to withdraw application: ${error.message}`);
        return;
      }
      
      console.log("Application withdrawal response:", data);
      
      if (!data || data.length === 0) {
        const msg = "No changes were made. You may not have permission to withdraw this application.";
        console.error(msg);
        setError(msg);
        toast.error(msg);
        return;
      }
      
      toast.success("Application withdrawn successfully");
      
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    } catch (error: any) {
      console.error("Exception withdrawing application:", error);
      setError(error.message || "An unexpected error occurred");
      toast.error(`Failed to withdraw application: ${error.message || "Unknown error"}`);
    } finally {
      setIsWithdrawing(null);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(applicationId);
      setError(null);
      
      console.log(`Attempting to update application ${applicationId} to status: ${newStatus}`);
      
      // Get the current user's session for user context
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const msg = "You must be logged in to update an application";
        console.error(msg);
        setError(msg);
        toast.error(msg);
        return;
      }
      
      // For business users updating others' applications, there's already a policy
      // For job seekers updating their own, the policy requires user_id match
      const { data, error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('job_app_id', applicationId)
        .select();
      
      if (error) {
        console.error("Error updating application status:", error);
        setError(error.message);
        toast.error(`Failed to update application: ${error.message}`);
        return;
      }
      
      console.log("Application update response:", data);
      
      if (!data || data.length === 0) {
        const msg = "No changes were made. You may not have permission to update this application.";
        console.error(msg);
        setError(msg);
        toast.error(msg);
        return;
      }
      
      toast.success(`Application status updated to ${newStatus}`);
      
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    } catch (error: any) {
      console.error("Exception updating application:", error);
      setError(error.message || "An unexpected error occurred");
      toast.error(`Failed to update application: ${error.message || "Unknown error"}`);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const openCV = (cvUrl: string) => {
    window.open(cvUrl, '_blank', 'noopener,noreferrer');
  };

  return {
    isWithdrawing,
    isUpdatingStatus,
    error,
    handleWithdraw,
    updateApplicationStatus,
    openCV
  };
};
