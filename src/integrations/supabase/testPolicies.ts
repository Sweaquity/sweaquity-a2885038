import { supabase } from './client';

// Test Cases
const testCases = [
  {
    description: "Authenticated User with Project ID in Path",
    bucketId: 'ticket-attachments',
    role: 'authenticated',
    path: 'project123/ticket456',
    expectedResult: true,
  },
  {
    description: "Reporter of the Ticket",
    bucketId: 'ticket-attachments',
    userId: 'reporter123',
    ticketId: 'ticket456',
    expectedResult: true,
  },
  {
    description: "Assigned User to the Ticket",
    bucketId: 'ticket-attachments',
    userId: 'assignedUser123',
    ticketId: 'ticket456',
    expectedResult: true,
  },
  {
    description: "Creator of Related Project Sub-tasks",
    bucketId: 'ticket-attachments',
    userId: 'subTaskCreator123',
    ticketId: 'ticket456',
    expectedResult: true,
  },
  {
    description: "Applicant in Related Job Applications",
    bucketId: 'ticket-attachments',
    userId: 'applicant123',
    ticketId: 'ticket456',
    expectedResult: true,
  },
  {
    description: "Creator of Related Business Project",
    bucketId: 'ticket-attachments',
    userId: 'businessProjectCreator123',
    ticketId: 'ticket456',
    expectedResult: true,
  },
  {
    description: "Creator of Business Project Related to the Business",
    bucketId: 'ticket-attachments',
    userId: 'businessProjectCreator123',
    ticketId: 'ticket456',
    expectedResult: true,
  },
];

// Function to simulate policy conditions
const simulatePolicy = async (testCase) => {
  const { description, bucketId, role, path, userId, ticketId, expectedResult } = testCase;
  try {
    const { data, error } = await supabase
      .from('ticket-attachments')
      .select('*')
      .eq('bucket_id', bucketId)
      .eq('role', role)
      .eq('path', path)
      .or(`reporter.eq.${userId},assigned_to.eq.${userId},created_by.eq.${userId}`)
      .eq('ticket_id', ticketId);

    if (error) {
      throw error;
    }

    const hasAccess = data.length > 0;
    console.log(`${description}: ${hasAccess === expectedResult ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.error(`${description}: ERROR - ${error.message}`);
  }
};

// Run test cases
testCases.forEach(testCase => simulatePolicy(testCase));
