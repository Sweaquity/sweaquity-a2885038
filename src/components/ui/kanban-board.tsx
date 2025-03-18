
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface KanbanColumn {
  id: string;
  title: string;
  ticketIds: string[];
}

interface KanbanTicket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date?: string;
}

interface KanbanBoardProps {
  columns: {[key: string]: KanbanColumn};
  tickets: {[key: string]: KanbanTicket};
  onTicketMove: (ticketId: string, newStatus: string) => void;
  onTicketClick: (ticketId: string) => void;
  formatDate: (date: string) => string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  tickets,
  onTicketMove,
  onTicketClick,
  formatDate
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: string) => {
    e.dataTransfer.setData("text/plain", ticketId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData("text/plain");
    if (ticketId) {
      onTicketMove(ticketId, columnId);
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-4 min-w-fit">
        {Object.values(columns).map(column => (
          <div 
            key={column.id} 
            className="w-64 bg-gray-50 rounded-md p-2"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <h3 className="font-medium mb-2">{column.title} ({column.ticketIds.length})</h3>
            <div className="space-y-2">
              {column.ticketIds.map((ticketId) => {
                const ticket = tickets[ticketId];
                if (!ticket) return null;
                
                return (
                  <Card 
                    key={ticketId} 
                    className={`
                      p-2 cursor-pointer
                      ${ticket.priority === 'high' ? 'border-l-4 border-l-red-500' : 
                        ticket.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
                        'border-l-4 border-l-blue-500'}
                    `}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticketId)}
                  >
                    <div className="text-sm font-medium">{ticket.title}</div>
                    <div className="text-xs text-gray-500 truncate">{ticket.description}</div>
                    <div className="flex justify-between mt-1">
                      <div className="text-xs">{ticket.due_date ? formatDate(ticket.due_date) : 'No due date'}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => onTicketClick(ticket.id)}
                      >
                        View
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
