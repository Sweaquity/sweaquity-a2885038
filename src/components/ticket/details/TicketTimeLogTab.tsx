
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "../utils/dateFormatters";
import { toast } from "sonner";
import { showRefreshNotification, RefreshType, showRefreshError } from "../utils/refreshNotification";

interface TimeEntry {
  id: string;
  ticket_id: string;
  hours_logged: number;
  description?: string;
  created_at: string;
  user_id?: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    id?: string;
  };
}

interface TicketTimeLogTabProps {
  ticketId: string;
  onLogTime?: (ticketId: string) => void;
  onDataChanged?: () => void; // Callback for parent notification
  refreshTrigger?: number; // New prop to force re-renders
}

export const TicketTimeLogTab: React.FC<TicketTimeLogTabProps> = ({
  ticketId,
  onLogTime,
  onDataChanged,
  refreshTrigger = 0
}) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [totalHoursLogged, setTotalHoursLogged] = useState<number>(0);
  const [isLoadingTimeEntries, setIsLoadingTimeEntries] = useState(false);
  const [timeEntriesError, setTimeEntriesError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeletingEntry, setIsDeletingEntry] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID on mount
    const getCurrentUser = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          console.log("Current auth user ID:", authData.user.id);
          setCurrentUserId(authData.user.id);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    
    getCurrentUser();
  }, []);
  
  // Separate effect for fetching time entries based on ticketId and refreshTrigger
  useEffect(() => {
    if (ticketId) {
      fetchTimeEntries(ticketId);
    }
  }, [ticketId, refreshTrigger]); // Add refreshTrigger to dependencies

  const fetchTimeEntries = async (ticketId: string) => {
    setIsLoadingTimeEntries(true);
    setTimeEntriesError(null);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Log all user_ids for debugging
      console.log("Time entries user_ids:", data?.map(entry => entry.user_id));
      
      // Process user names for each entry
      const entriesWithUserDetails = await Promise.all((data || []).map(async (entry) => {
        if (entry.user_id) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name, email, id')
              .eq('id', entry.user_id)
              .single();
              
            return {
              ...entry,
              profiles: profileData || { email: 'Unknown user' }
            };
          } catch (error) {
            console.warn(`Could not fetch profile for user ${entry.user_id}:`, error);
            return {
              ...entry,
              profiles: { email: 'Unknown user' }
            };
          }
        }
        return entry;
      }));
      
      setTimeEntries(entriesWithUserDetails);
      
      // Calculate and set total hours logged
      const total = entriesWithUserDetails.reduce((sum, entry) => sum + (entry.hours_logged || 0), 0);
      setTotalHoursLogged(total);
      
      // Simplified ticket updating - don't check for column existence
      try {
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ hours_logged: total })
          .eq('id', ticketId);
          
        if (updateError && updateError.code !== '42703') { // Ignore column not found error
          console.warn("Could not update ticket hours:", updateError);
        }
      } catch (error) {
        console.warn("Error updating ticket hours:", error);
      }
      
      // Notify parent component that data has changed
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      setTimeEntriesError('Failed to load time entries. Please try again.');
    } finally {
      setIsLoadingTimeEntries(false);
    }
  };

  // Handle log time action
  const handleLogTimeClick = () => {
    if (onLogTime) {
      onLogTime(ticketId);
      
      // Show success notification
      showRefreshNotification(RefreshType.TIME_LOG);
      
      // Fetch time entries again after a delay to ensure the new entry is included
      setTimeout(() => {
        fetchTimeEntries(ticketId);
        if (onDataChanged) {
          onDataChanged();
        }
      }, 1000);
    }
  };

  // Handle delete time entry
  const handleDeleteTimeEntry = async (entryId: string) => {
    setIsDeletingEntry(entryId);
    try {
      // Get the entry first to confirm user_id matches
      const { data: entryData, error: fetchError } = await supabase
        .from('time_entries')
        .select('user_id')
        .eq('id', entryId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Log for debugging
      console.log("Entry to delete - user_id:", entryData?.user_id);
      console.log("Current user ID:", currentUserId);
      
      // Check if user can delete this entry
      if (entryData?.user_id !== currentUserId) {
        throw new Error("You can only delete your own time entries");
      }
      
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId);
        
      if (error) throw error;
      
      // Remove the entry from local state
      const updatedEntries = timeEntries.filter(entry => entry.id !== entryId);
      setTimeEntries(updatedEntries);
      
      // Recalculate total hours
      const newTotal = updatedEntries.reduce((sum, entry) => sum + (entry.hours_logged || 0), 0);
      setTotalHoursLogged(newTotal);
      
      // Update ticket's total hours - simplified
      try {
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ hours_logged: newTotal })
          .eq('id', ticketId);
          
        if (updateError && updateError.code !== '42703') { // Ignore column not found error
          console.warn("Could not update ticket hours:", updateError);
        }
      } catch (error) {
        console.warn("Error updating ticket hours:", error);
      }
      
      showRefreshNotification(RefreshType.TIME_LOG);
      
      // Notify parent component
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error: any) {
      console.error('Error deleting time entry:', error);
      showRefreshError(RefreshType.TIME_LOG, error);
    } finally {
      setIsDeletingEntry(null);
    }
  };

  return (
    <div className="space-y-4" key={`time-log-${ticketId}-${refreshTrigger}`}>
      <div className="bg-gray-50 p-4 rounded-md border mb-4">
        <p className="text-sm text-gray-500 mb-2">
          Time Log shows all time entries recorded for this ticket.
        </p>
        <p className="text-sm font-medium">
          Total Hours Logged: {totalHoursLogged.toFixed(2)} hours
        </p>
      </div>
      
      {isLoadingTimeEntries ? (
        <div className="flex justify-center p-8">
          <p>Loading time entries...</p>
        </div>
      ) : timeEntriesError ? (
        <div className="flex items-center justify-center p-8 bg-red-50 rounded-md border border-red-200">
          <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
          <p className="text-red-700">{timeEntriesError}</p>
        </div>
      ) : (
        <div>
          {timeEntries.length === 0 ? (
            <div className="text-center text-gray-500 py-8 border rounded-md">
              <p>No time entries found for this ticket.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries.map((entry) => (
                    <tr key={`${entry.id}-${refreshTrigger}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.profiles ? 
                          `${entry.profiles.first_name || ''} ${entry.profiles.last_name || ''}`.trim() || entry.profiles.email : 
                          'Unknown user'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.hours_logged.toFixed(2)} hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {entry.description || 'No description'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-start gap-1">
                          {currentUserId === entry.user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTimeEntry(entry.id)}
                              disabled={isDeletingEntry === entry.id}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete this time entry"
                            >
                              {isDeletingEntry === entry.id ? 
                                <span className="text-xs">Deleting...</span> : 
                                <Trash2 className="h-4 w-4" />
                              }
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {onLogTime && (
            <div className="mt-4">
              <Button onClick={handleLogTimeClick}>
                <Clock className="h-4 w-4 mr-2" /> Log Time
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
