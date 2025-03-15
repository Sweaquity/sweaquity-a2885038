import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TimeTracker = ({ ticketId, userId }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeEntryId, setTimeEntryId] = useState(null);
  const [description, setDescription] = useState('');
  const [timeEntries, setTimeEntries] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    fetchTimeEntries();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [ticketId]);

  const fetchTimeEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      setTimeEntries(data);
      
      // Calculate total hours
      const total = data.reduce((sum, entry) => {
        return sum + (entry.hours_logged || 0);
      }, 0);
      
      setTotalHours(total);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async () => {
    const now = new Date();
    setStartTime(now);
    setIsTracking(true);
    
    // Create a new time entry
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          start_time: now.toISOString(),
          description: description
        })
        .select()
        .single();

      if (error) throw error;
      
      setTimeEntryId(data.id);
      
      // Start the timer to update elapsed time
      const intervalId = setInterval(() => {
        const currentTime = new Date();
        const elapsed = (currentTime - now) / 1000; // seconds
        setElapsedTime(elapsed);
      }, 1000);
      
      setTimer(intervalId);
    } catch (error) {
      console.error('Error starting time tracking:', error);
    }
  };

  const stopTracking = async () => {
    if (!isTracking || !timeEntryId) return;
    
    const endTime = new Date();
    const hoursLogged = (endTime - startTime) / (1000 * 60 * 60); // Convert ms to hours
    
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          hours_logged: hoursLogged,
          description: description
        })
        .eq('id', timeEntryId);

      if (error) throw error;
      
      // Clear timer
      if (timer) clearInterval(timer);
      setTimer(null);
      
      // Reset state
      setIsTracking(false);
      setStartTime(null);
      setTimeEntryId(null);
      setDescription('');
      setElapsedTime(0);
      
      // Refresh time entries
      fetchTimeEntries();
    } catch (error) {
      console.error('Error stopping time tracking:', error);
    }
  };

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-md shadow p-4">
      <h3 className="text-lg font-bold mb-4">Time Tracker</h3>
      
      <div className="mb-4">
        <p className="text-lg font-semibold">
          Total time logged: <span className="text-blue-600">{totalHours.toFixed(2)} hours</span>
        </p>
      </div>
      
      <div className="mb-4">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you working on?"
          className="w-full p-2 border rounded-md mb-2"
          disabled={isTracking}
        />
        
        {isTracking ? (
          <div className="mb-4">
            <div className="text-2xl font-mono text-center mb-2">
              {formatTime(elapsedTime)}
            </div>
            <button
              onClick={stopTracking}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Stop
            </button>
          </div>
        ) : (
          <button
            onClick={startTracking}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
