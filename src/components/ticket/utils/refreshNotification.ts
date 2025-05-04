
import { toast } from "sonner";

// Types of notifications
export enum RefreshType {
  CONVERSATION = 'conversation',
  ACTIVITY = 'activity',
  TIME_LOG = 'time_log',
  ATTACHMENTS = 'attachments',
  DETAILS = 'details'
}

// Show appropriate notification based on the type
export const showRefreshNotification = (type: RefreshType): void => {
  switch (type) {
    case RefreshType.CONVERSATION:
      toast.success("Conversation updated successfully");
      break;
    case RefreshType.ACTIVITY:
      toast.success("Activity log updated");
      break;
    case RefreshType.TIME_LOG:
      toast.success("Time log updated");
      break;
    case RefreshType.ATTACHMENTS:
      toast.success("Attachments updated");
      break;
    case RefreshType.DETAILS:
      toast.success("Ticket details updated");
      break;
    default:
      toast.success("Changes saved successfully");
  }
};

// Handle errors with appropriate notifications
export const showRefreshError = (type: RefreshType, error: any): void => {
  const errorMessage = error?.message || "An error occurred";
  
  switch (type) {
    case RefreshType.CONVERSATION:
      toast.error(`Failed to update conversation: ${errorMessage}`);
      break;
    case RefreshType.ACTIVITY:
      toast.error(`Failed to update activity log: ${errorMessage}`);
      break;
    case RefreshType.TIME_LOG:
      toast.error(`Failed to update time log: ${errorMessage}`);
      break;
    case RefreshType.ATTACHMENTS:
      toast.error(`Failed to update attachments: ${errorMessage}`);
      break;
    case RefreshType.DETAILS:
      toast.error(`Failed to update ticket details: ${errorMessage}`);
      break;
    default:
      toast.error(`Operation failed: ${errorMessage}`);
  }
};
