
import { useState } from "react";
import { useAcceptedJobsCore } from "./jobs/useAcceptedJobsCore";
import { useJobAcceptance } from "./jobs/useJobAcceptance";
import { JobApplication } from "@/types/jobSeeker";
import { toast } from "sonner";

export const useAcceptedJobs = (onUpdate?: () => void) => {
  const [isLoggingTime, setIsLoggingTime] = useState(false);
  
  const { 
    acceptJobAsJobSeeker, 
    acceptJobAsBusiness,
    syncAcceptedJobs,
    isLoading: isAccepting 
  } = useJobAcceptance(onUpdate);
  
  const { 
    logJobEffort,
    isLoading: isCoreLoading
  } = useAcceptedJobsCore(onUpdate);
  
  const logTime = async (jobAppId: string, hours: number, description: string) => {
    try {
      setIsLoggingTime(true);
      
      if (!hours || hours <= 0) {
        toast.error("Please enter a valid number of hours");
        return false;
      }
      
      if (!description.trim()) {
        toast.error("Please enter a description of the work done");
        return false;
      }
      
      const success = await logJobEffort(jobAppId, hours, description);
      
      if (success && onUpdate) {
        onUpdate();
      }
      
      return success;
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time");
      return false;
    } finally {
      setIsLoggingTime(false);
    }
  };
  
  return {
    isLoading: isAccepting || isCoreLoading || isLoggingTime,
    acceptJobAsJobSeeker,
    acceptJobAsBusiness,
    logTime,
    syncAcceptedJobs
  };
};
