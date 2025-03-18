import React from "react";
import { AdminTicketManager } from "@/components/admin/tickets/AdminTicketManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SweaquityDashboard = () => {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Sweaquity Admin Dashboard</h1>
      
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Beta Testing Status</TabsTrigger>
          {/* Add other tabs as needed */}
        </TabsList>
        
        <TabsContent value="tickets" className="space-y-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Beta Testing Tickets</h2>
            <AdminTicketManager />
          </div>
        </TabsContent>
        
        {/* Add other tab content as needed */}
      </Tabs>
    </div>
  );
};

export default SweaquityDashboard;
