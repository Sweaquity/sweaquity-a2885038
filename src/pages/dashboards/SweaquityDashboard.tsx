import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { GanttChartView } from "@/components/business/gantt/GanttChartView";

// ... keep existing code (imports and component definitions)

export const SweaquityDashboard = () => {
  // ... keep existing code (state definitions and hooks)

  // Modify just the part that loads beta tickets
  const loadBetaTickets = async () => {
    try {
      // Modified query to avoid the relationship error
      const { data, error } = await supabase
        .from('tickets')
        .select('*, profiles:reporter(*)')
        .or('title.ilike.%Beta%,description.ilike.%Beta%,title.ilike.%Testing%')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching beta tickets:", error);
        toast.error("Failed to load beta tickets");
        return;
      }

      setBetaTickets(data || []);
    } catch (error) {
      console.error("Error loading beta tickets:", error);
      toast.error("Failed to load beta tickets");
    }
  };

  // ... keep existing code (other functions)

  return (
    <div className="container mx-auto p-4">
      {/* ... keep existing code (UI elements and components) */}
      
      {/* Fix the GanttChartView props */}
      <GanttChartView 
        ganttTasks={tasks.map(task => ({
          id: task.id,
          task: task.task,
          start: task.start,
          end: task.end,
          progress: task.progress,
          type: task.type,
          project: task.project
        }))} 
      />
      
      {/* ... keep existing code (remaining UI elements) */}
    </div>
  );
};

export default SweaquityDashboard;
