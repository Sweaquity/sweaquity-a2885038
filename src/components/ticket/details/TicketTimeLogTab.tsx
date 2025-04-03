
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "../utils/dateFormatters";

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
}

export const TicketTimeLogTab: React.FC<TicketTimeLogTabProps> = ({
  ticketId,
  onLogTime
}) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoadingTimeEntries, setIsLoadingTimeEntries] = useState(false);
  const [timeEntriesError, setTimeEntriesError] = useState<string | null>(null);

  useEffect(() => {
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
    } catch (error) {
      console.error('Error fetching time entries:', error);
      setTimeEntriesError('Failed to load time entries. Please try again.');
    } finally {
      setIsLoadingTimeEntries(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md border mb-4">
        <p className="text-sm text-gray-500 mb-2">
          Time Log shows all time entries recorded for this ticket.
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {onLogTime && (
            <div className="mt-4">
              <Button onClick={() => onLogTime(ticketId)}>
                <Clock className="h-4 w-4 mr-2" /> Log Time
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
