
import { useJobSeekerDashboardCore } from './job-seeker/dashboard/useJobSeekerDashboardCore';

export const useJobSeekerDashboard = (refreshTrigger = 0) => {
  return useJobSeekerDashboardCore(refreshTrigger);
};
