import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    users: 0,
    jobsPosted: 0,
    jobsMatched: 0,
    jobsCompleted: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
  });
  
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch("/api/dashboardStats");
        const stats = await response.json();

        const ticketResponse = await fetch("/api/ticketStats");
        const ticketStats = await ticketResponse.json();

        setDashboardData({
          users: stats.users || 0,
          jobsPosted: stats.jobsPosted || 0,
          jobsMatched: stats.jobsMatched || 0,
          jobsCompleted: stats.jobsCompleted || 0,
          openTickets: ticketStats.openTickets || 0,
          closedTickets: ticketStats.closedTickets || 0,
          highPriorityTickets: ticketStats.highPriorityTickets || 0,
        });

        setTickets(ticketStats.tickets || []);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchDashboardStats();
  }, []);

  const chartData = [
    { name: "Users", count: dashboardData.users },
    { name: "Jobs Posted", count: dashboardData.jobsPosted },
    { name: "Jobs Matched", count: dashboardData.jobsMatched },
    { name: "Jobs Completed", count: dashboardData.jobsCompleted },
    { name: "Open Tickets", count: dashboardData.openTickets },
    { name: "Closed Tickets", count: dashboardData.closedTickets },
    { name: "High Priority Tickets", count: dashboardData.highPriorityTickets },
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {chartData.map((data, index) => (
          <Card key={index} className="p-4">
            <CardContent>
              <h2 className="text-lg font-semibold">{data.name}</h2>
              <p className="text-2xl font-bold">{data.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-2">Ticket Status</h2>
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">Date Age</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket, index) => (
              <tr key={index} className="border">
                <td className="border px-4 py-2">{ticket.dateAge}</td>
                <td className={`border px-4 py-2 ${ticket.status === 'Red' ? 'text-red-500' : ticket.status === 'Amber' ? 'text-yellow-500' : 'text-green-500'}`}>{ticket.status}</td>
                <td className="border px-4 py-2">{ticket.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
