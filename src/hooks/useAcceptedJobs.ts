
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { JobApplication } from "@/types/jobSeeker";
import { useJobAcceptance } from "./jobs/useJobAcceptance";

export const useAcceptedJobs = (onUpdate?: () => void) => {
  const {
    acceptJobAsJobSeeker,
    acceptJobAsBusiness,
    isLoading
  } = useJobAcceptance(onUpdate);

  return {
    acceptJobAsJobSeeker,
    acceptJobAsBusiness,
    isLoading
  };
};
