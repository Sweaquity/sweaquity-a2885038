
import { createStore } from 'redux';

// Initial state
const initialState = {
  tickets: [],
  columns: {
    'new': { id: 'new', title: 'New', ticketIds: [] },
    'in-progress': { id: 'in-progress', title: 'In Progress', ticketIds: [] },
    'blocked': { id: 'blocked', title: 'Blocked', ticketIds: [] },
    'review': { id: 'review', title: 'Review', ticketIds: [] },
    'done': { id: 'done', title: 'Done', ticketIds: [] },
    'closed': { id: 'closed', title: 'Closed', ticketIds: [] }
  },
  columnOrder: ['new', 'in-progress', 'blocked', 'review', 'done', 'closed']
};

// Reducer
function kanbanReducer(state = initialState, action: any) {
  switch (action.type) {
    case 'SET_TICKETS':
      return {
        ...state,
        tickets: action.payload
      };
    case 'SET_COLUMNS':
      return {
        ...state,
        columns: action.payload
      };
    case 'MOVE_TICKET':
      const { ticketId, source, destination } = action.payload;
      
      // Create new column objects
      const sourceColumn = {...state.columns[source.droppableId]};
      const destColumn = {...state.columns[destination.droppableId]};
      
      // Create new ticketIds arrays
      const sourceTicketIds = [...sourceColumn.ticketIds];
      const destTicketIds = source.droppableId === destination.droppableId 
        ? sourceTicketIds 
        : [...destColumn.ticketIds];
      
      // Remove from source
      sourceTicketIds.splice(source.index, 1);
      
      // Insert into destination
      if (source.droppableId === destination.droppableId) {
        sourceTicketIds.splice(destination.index, 0, ticketId);
      } else {
        destTicketIds.splice(destination.index, 0, ticketId);
        
        // Update columns
        sourceColumn.ticketIds = sourceTicketIds;
        destColumn.ticketIds = destTicketIds;
      }
      
      // Create the new state
      return {
        ...state,
        columns: {
          ...state.columns,
          [sourceColumn.id]: sourceColumn,
          [destColumn.id]: destColumn
        }
      };
    default:
      return state;
  }
}

// Create the store
export const store = createStore(kanbanReducer);
