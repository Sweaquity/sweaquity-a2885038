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
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
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
      
      const entriesWithUserDetails = await Promise.all((data || []).map(async (entry) => {
        if (entry.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
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
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast.error("Failed to delete time entry");
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
