import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "../utils/dateFormatters";
import { toast } from "sonner";

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
    auth_id?: string;
  };
}

interface TicketTimeLogTabProps {
  ticketId: string;
  onLogTime?: (ticketId: string) => void;
  onDataChanged?: () => void; // Callback for parent notification
}

export const TicketTimeLogTab: React.FC<TicketTimeLogTabProps> = ({
  ticketId,
  onLogTime,
  onDataChanged
}) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [totalHoursLogged, setTotalHoursLogged] = useState<number>(0);
  const [isLoadingTimeEntries, setIsLoadingTimeEntries] = useState(false);
  const [timeEntriesError, setTimeEntriesError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeletingEntry, setIsDeletingEntry] = useState<string | null>(null);
  
  // Create a unique key that captures both the ticket ID and the state of time entries
  const entriesKey = timeEntries.map(entry => entry.id).join(',');
  const ticketKey = `ticket-${ticketId}-${entriesKey}`;

  useEffect(() => {
    // Get current user ID
    const getCurrentUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        console.log("Current auth user ID:", authData.user.id);
        
        // Also check the profiles table to get any alternate user ID
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_id', authData.user.id)
          .single();
          
        if (error) {
          console.error("Error fetching profile:", error);
          setCurrentUserId(authData.user.id);
        } else if (profileData) {
          console.log("Current profile ID:", profileData.id);
          setCurrentUserId(profileData.id);
        } else {
          setCurrentUserId(authData.user.id);
        }
      }
    };
    
    getCurrentUser();
    
    if (ticketId) {
      fetchTimeEntries(ticketId);
    }
  }, [ticketId]);

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
      
      // Log all user_ids to debug
      console.log("Time entries user_ids:", data?.map(entry => entry.user_id));
      
      const entriesWithUserDetails = await Promise.all((data || []).map(async (entry) => {
        if (entry.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, id, auth_id')
            .eq('id', entry.user_id)
            .single();
            
          return {
            ...entry,
            profiles: profileData
          };
        }
        return entry;
      }));
      
      setTimeEntries(entriesWithUserDetails);
      
      // Calculate and set total hours logged
      const total = entriesWithUserDetails.reduce((sum, entry) => sum + (entry.hours_logged || 0), 0);
      setTotalHoursLogged(total);
      
      // Update the ticket's hours_logged in the database
      await updateTicketHoursLogged(ticketId, total);
      
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

  // Update the ticket's hours_logged field in the database
  const updateTicketHoursLogged = async (ticketId: string, hoursLogged: number) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ hours_logged: hoursLogged })
        .eq('id', ticketId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating ticket hours logged:', error);
    }
  };

  // Handle log time action
  const handleLogTimeClick = () => {
    if (onLogTime) {
      onLogTime(ticketId);
      // Fetch time entries again after a delay to ensure the new entry is included
      setTimeout(() => fetchTimeEntries(ticketId), 1000);
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
      // This is a backup check in addition to UI hiding - security best practice
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
      
      // Update ticket's total hours
      await updateTicketHoursLogged(ticketId, newTotal);
      
      toast.success("Time entry deleted successfully");
      
      // Notify parent component
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error: any) {
      console.error('Error deleting time entry:', error);
      toast.error(error?.message || "Failed to delete time entry");
    } finally {
      setIsDeletingEntry(null);
    }
  };

  return (
    <div className="space-y-4" key={ticketKey}>
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
                    <tr key={entry.id}>
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
                        {/* 
                          Add debugging info in a comment 
                          entry.user_id: {entry.user_id} 
                          currentUserId: {currentUserId}
                        */}
                        <div className="flex items-center justify-start gap-1">
                          {/* Show delete button either if the IDs match exactly OR user_id is in profiles.id OR profiles.auth_id */}
                          {(currentUserId === entry.user_id || 
                            entry.profiles?.id === currentUserId || 
                            entry.profiles?.auth_id === currentUserId) && (
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
            <div className="mt-4 flex gap-2">
              <Button onClick={handleLogTimeClick}>
                <Clock className="h-4 w-4 mr-2" /> Log Time
              </Button>
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log({
                      currentUserId,
                      timeEntries: timeEntries.map(entry => ({
                        id: entry.id,
                        user_id: entry.user_id,
                        profile: entry.profiles ? {
                          id: entry.profiles.id,
                          auth_id: entry.profiles.auth_id
                        } : null
                      }))
                    });
                    toast.info("User ID debug info logged to console");
                  }}
                >
                  Debug User IDs
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
