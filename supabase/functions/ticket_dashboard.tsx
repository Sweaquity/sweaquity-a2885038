import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom'; // If you're using React Router

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'mine', 'open', 'done'
  
  useEffect(() => {
    fetchTickets();
  }, [filter]);
  
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const user = supabase.auth.user();
      let query = supabase
        .from('tickets')
        .select(`
          *,
          assigned_user:assigned_to(email),
          project:project_id(title)
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filter === 'mine') {
        query = query.eq('assigned_to', user.id);
      } else if (filter === 'open') {
        query = query.neq('status', 'done');
      } else if (filter === 'done') {
        query = query.eq('status', 'done');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to render health indicator
  const renderHealthIndicator = (health) => {
    const colors = {
      red: 'bg-red-500',
      amber: 'bg-yellow-500',
      green: 'bg-green-500'
    };
    
    return (
      <span 
        className={`inline-block w-3 h-3 rounded-full ${colors[health] || 'bg-gray-500'}`} 
        title={`Health: ${health}`}
      />
    );
  };
  
  // Helper function to render status badge
  const renderStatusBadge = (status) => {
    const badges = {
      backlog: 'bg-gray-100 text-gray-800',
      todo: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-
