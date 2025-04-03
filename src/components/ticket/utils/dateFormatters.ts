
import { format, parseISO } from "date-fns";

export const formatDate = (date: string | null) => {
  if (!date) return "Not set";
  try {
    return format(parseISO(date), "PPP");
  } catch (error) {
    return "Invalid date";
  }
};

export const formatDateTime = (date: string | null) => {
  if (!date) return "Not set";
  try {
    return format(parseISO(date), "PPP p");
  } catch (error) {
    return "Invalid date";
  }
};
