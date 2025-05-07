
import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, ArrowLeft, Copy, Edit, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { Project, Ticket } from "@/types/business";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";
import { TaskCompletionReview } from "./TaskCompletionReview";

interface LiveProjectsTabProps {
  projectId?: string;
  projects: Project[];
  onProjectChange: (projectId: string) => void;
}

const reorder = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

// Create custom components for UpdateTicketDialog and DeleteTicketDialog
const UpdateTicketDialog = ({ open, onClose, ticket, onUpdateTicket, projects }: { 
  open: boolean; 
  onClose: () => void; 
  ticket: Ticket; 
  onUpdateTicket: () => void; 
  projects: Project[] 
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" defaultValue={ticket.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea 
              id="description" 
              className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              defaultValue={ticket.description}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onUpdateTicket(); onClose(); }}>Update Ticket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DeleteTicketDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  isDeleting, 
  ticketTitle, 
  errorMessage 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  ticketTitle: string;
  errorMessage?: string;
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete ticket: <strong>{ticketTitle}</strong>
            <br />
            This action cannot be undone. The ticket will be permanently removed.
            {errorMessage && (
              <div className="mt-2 p-2 bg-red-50 text-red-600 rounded-md">
                Error: {errorMessage}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
          >
            {isDeleting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const LiveProjectsTab = ({ projectId, projects, onProjectChange }: LiveProjectsTabProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // React Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    loadTickets();
  }, [projectId, forceRefresh]);

  const loadTickets = async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Failed to load tickets");
      }

      setTickets(data || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = () => {
    setIsCreateDialogOpen(true);
  };

  const handleUpdateTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDeleteDialogOpen(true);
  };

  const confirmTicketDeletion = async () => {
    if (!selectedTicket) return;
    
    setIsDeleting(true);
    setDeleteErrorMessage(undefined);
    
    try {
      // Delete the ticket
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', selectedTicket.id);
      
      if (error) {
        console.error("Error deleting ticket:", error);
        throw error;
      }
      
      toast.success("Ticket deleted successfully");
      setTickets(tickets.filter(ticket => ticket.id !== selectedTicket.id));
      setIsDeleteDialogOpen(false);
      return Promise.resolve();
    } catch (error: any) {
      console.error("Error deleting ticket:", error);
      
      // Create a user-friendly error message based on the error
      let errorMessage = "Failed to delete ticket";
      if (error?.message) {
        if (error.message.includes("time entries")) {
          errorMessage = "Cannot delete ticket with time entries";
        } else if (error.message.includes("completion progress")) {
          errorMessage = "Cannot delete ticket with completion progress";
        } else if (error.message.includes("legal documents")) {
          errorMessage = "Cannot delete ticket with associated legal documents";
        } else {
          errorMessage = `${error.message}`;
        }
      }
      
      setDeleteErrorMessage(errorMessage);
      throw error; // Re-throw for the DeleteTicketDialog to handle
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTicketCreated = () => {
    setIsCreateDialogOpen(false);
    setForceRefresh(prev => prev + 1);
  };

  const handleTicketUpdated = () => {
    setIsEditDialogOpen(false);
    setForceRefresh(prev => prev + 1);
  };

  const handleTicketDeleted = () => {
    setIsDeleteDialogOpen(false);
    setForceRefresh(prev => prev + 1);
  };
  
  const handleApproveTicket = async (ticketId: string, notes: string) => {
    try {
      setIsLoading(true);
      
      // Update the ticket status to 'completed'
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'completed', notes: notes })
        .eq('id', ticketId);
      
      if (updateError) throw updateError;
      
      toast.success("Ticket approved successfully");
      setForceRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Error approving ticket:', error);
      toast.error('Failed to approve ticket');
    } finally {
      setIsLoading(false);
      setIsReviewDialogOpen(false);
    }
  };
  
  const handleRejectTicket = async (ticketId: string, notes: string) => {
    try {
      setIsLoading(true);
      
      // Update the ticket status to 'open' (or 'rejected' if you have such a status)
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'open', notes: notes })
        .eq('id', ticketId);
      
      if (updateError) throw updateError;
      
      toast.success("Ticket rejected successfully");
      setForceRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Error rejecting ticket:', error);
      toast.error('Failed to reject ticket');
    } finally {
      setIsLoading(false);
      setIsReviewDialogOpen(false);
    }
  };

  const columns: ColumnDef<Ticket>[] = [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "priority",
      header: "Priority",
    },
    {
      accessorKey: "health",
      header: "Health",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleUpdateTicket(ticket)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteTicket(ticket)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setSelectedTicket(ticket);
                setIsReviewDialogOpen(true);
              }}>
                <Copy className="mr-2 h-4 w-4" /> Review Completion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  const table = useReactTable({
    data: tickets,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = reorder(
      tickets,
      result.source.index,
      result.destination.index
    );

    setTickets(items);

    // Optimistically update the state, but you should also persist this change to the database
    // and handle any errors that might occur during the update.
    // For simplicity, this example only updates the local state.
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          {tickets.length} total tickets
        </div>
        <Button onClick={handleCreateTicket}>Create Ticket</Button>
      </div>
      <div className="rounded-md border">
        <div className="flex items-center py-2 px-4">
          <Input
            placeholder="Filter tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <MoreHorizontal className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {table
                .getAllColumns()
                .filter(
                  (column) => column.getCanHide()
                )
                .map(
                  (column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  }
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ScrollArea>
          <div className="relative">
            <div className="absolute inset-0">
              {isLoading ? (
                <div className="flex flex-col space-y-2 p-4">
                  <Skeleton className="h-8 w-[200px]" />
                  <Skeleton className="h-4 w-[400px]" />
                  <Skeleton className="h-4 w-[400px]" />
                  <Skeleton className="h-4 w-[400px]" />
                  <Skeleton className="h-4 w-[400px]" />
                  <Skeleton className="h-4 w-[400px]" />
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="droppable">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {table.getRowModel().rows.map((row, index) => (
                          <Draggable key={row.id} draggableId={row.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
                                className="border-b last:border-none"
                              >
                                <div className="grid grid-cols-4 gap-2 p-4">
                                  {row.getVisibleCells().map((cell) => (
                                    <div key={cell.id}>
                                      {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      <CreateTicketDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateTicket={handleTicketCreated}
        projects={projects}
      />

      {selectedTicket && (
        <UpdateTicketDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          ticket={selectedTicket}
          onUpdateTicket={handleTicketUpdated}
          projects={projects}
        />
      )}

      {selectedTicket && (
        <DeleteTicketDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmTicketDeletion}
          isDeleting={isDeleting}
          ticketTitle={selectedTicket.title}
          errorMessage={deleteErrorMessage}
        />
      )}

      {selectedTicket && (
        <TaskCompletionReview
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          ticketId={selectedTicket.id}
          ticketData={{
            title: selectedTicket.title,
            description: selectedTicket.description,
            completion_percentage: selectedTicket.completion_percentage,
            project_id: selectedTicket.project_id,
            assigned_to: selectedTicket.assigned_to,
            job_app_id: selectedTicket.job_app_id,
            task_id: selectedTicket.task_id
          }}
          onReviewComplete={async (approved, notes) => {
            if (approved) {
              await handleApproveTicket(selectedTicket.id, notes);
            } else {
              await handleRejectTicket(selectedTicket.id, notes);
            }
            return Promise.resolve();
          }}
        />
      )}
    </div>
  );
};

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Simple Filter component
function Filter({ column, table }: { column: any; table: any }) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);
  
  const columnFilterValue = column.getFilterValue();
  
  const sortedUniqueValues = useCallback(
    () =>
      typeof firstValue === 'number'
        ? []
        : Array.from(column.getFacetedUniqueValues().keys()).sort(),
    [column.getFacetedUniqueValues()]
  )();

  return typeof firstValue === 'number' ? (
    <div>
      <div className="flex space-x-2">
        <Input
          type="number"
          value={(columnFilterValue?.[0] ?? '').toString()}
          onChange={e =>
            column.setFilterValue((old: [string, string]) => [e.target.value, old?.[1]])
          }
          placeholder={`Min`}
          className="w-24"
        />
        <Input
          type="number"
          value={(columnFilterValue?.[1] ?? '').toString()}
          onChange={e =>
            column.setFilterValue((old: [string, string]) => [old?.[0], e.target.value])
          }
          placeholder={`Max`}
          className="w-24"
        />
      </div>
    </div>
  ) : (
    <>
      <ul className="p-2">
        {sortedUniqueValues.slice(0, 10).map((value: any) => (
          <li
            key={value}
            className="flex items-center"
          >
            <label htmlFor={value} className="flex items-center">
              <Input
                type="checkbox"
                id={value}
                checked={column.getFilterValue()?.includes(value)}
                onChange={e => {
                  column.setFilterValue(old => {
                    return e.target.checked
                      ? [...(old || []), value]
                      : old?.filter((v: any) => v !== value)
                  })
                }}
                className="mr-2 h-4 w-4"
              />
              <span>{value}</span>
            </label>
          </li>
        ))}
      </ul>
      {sortedUniqueValues.length > 10 ? (
        <div className="p-2 text-center text-muted-foreground">
          Only showing top 10 results
        </div>
      ) : null}
    </>
  );
}
