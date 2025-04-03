
import { useState, useEffect } from "react";
import { Ticket } from "@/types/types";

export const useTicketDashboard = (initialTickets: Ticket[]) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  useEffect(() => {
    let filtered = [...tickets];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(term) ||
          (ticket.description && ticket.description.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.type === typeFilter);
    }

    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [tickets, searchTerm, statusFilter, priorityFilter, typeFilter]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const displayedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDialogOpen(true);
  };

  const closeTicketDetails = () => {
    setIsDialogOpen(false);
  };

  const showDeleteConfirmation = (ticket: Ticket) => {
    setTicketToDelete(ticket);
    setIsDeleteDialogOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setTicketToDelete(null);
  };

  return {
    tickets,
    setTickets,
    filteredTickets,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    typeFilter,
    setTypeFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    displayedTickets,
    selectedTicket,
    isDialogOpen,
    openTicketDetails,
    closeTicketDetails,
    ticketToDelete,
    isDeleteDialogOpen,
    showDeleteConfirmation,
    cancelDelete,
    itemsPerPage
  };
};
