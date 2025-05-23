
import { useAcceptedJobsCore, AcceptedJob } from "./jobs/useAcceptedJobsCore";
import { useJobAcceptance } from "./jobs/useJobAcceptance";
import { useContractManagement } from "./jobs/useContractManagement";

// Re-export the type with the correct syntax
export type { AcceptedJob } from "./jobs/useAcceptedJobsCore";

export const useAcceptedJobs = (onUpdate?: () => void) => {
  const { getAcceptedJob } = useAcceptedJobsCore(onUpdate);
  const { isLoading, acceptJobAsJobSeeker, acceptJobAsBusiness } = useJobAcceptance(onUpdate);
  const { isUploading, uploadContract, updateEquityTerms } = useContractManagement(onUpdate);
  
  return {
    isLoading,
    isUploading,
    acceptJobAsJobSeeker,
    acceptJobAsBusiness,
    uploadContract,
    updateEquityTerms,
    getAcceptedJob
  };
};
