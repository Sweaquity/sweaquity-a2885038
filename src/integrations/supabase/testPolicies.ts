
import { supabase } from './client';

// Function to test if a user can access files in a storage bucket
async function testStorageAccess(userId: string, bucketId: string, filePath: string) {
  try {
    // For testing storage policies, we need to be authenticated as the user
    console.log(`Testing storage access for user ${userId} to ${bucketId}/${filePath}`);
    
    // Check if we're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "Not authenticated", status: "Not authenticated" };
    }
    
    // Check if the bucket exists using storage API directly
    const { data, error } = await supabase.storage
      .from(bucketId)
      .list(filePath || '');
    
    if (error) {
      console.error("Storage access error:", error);
      return { success: false, error, status: error.message };
    }
    
    return { success: true, data, status: "Access granted" };
  } catch (error: any) {
    console.error("Error testing storage access:", error);
    return { success: false, error, status: error.message || "Unknown error" };
  }
}

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
const simulatePolicy = async (testCase: any) => {
  const { description, bucketId, role, path, userId, ticketId, expectedResult } = testCase;
  
  console.log(`Running test: ${description}`);
  
  try {
    // For storage policies, we need to test actual storage access
    if (bucketId && (path || (userId && ticketId))) {
      const fullPath = path || `${userId}/${ticketId}`;
      const result = await testStorageAccess(userId || 'test-user', bucketId, fullPath);
      
      console.log(`${description}: ${result.success === expectedResult ? 'PASS' : 'FAIL'} - ${result.status}`);
      return result;
    }
    
    console.log(`${description}: SKIP - Not a storage test case`);
    return null;
  } catch (error: any) {
    console.error(`${description}: ERROR - ${error.message}`);
    return { success: false, error, status: error.message };
  }
};

// Run test cases
export const runPolicyTests = async () => {
  console.log("Running storage policy tests...");
  const results = [];
  for (const testCase of testCases) {
    results.push(await simulatePolicy(testCase));
  }
  return results;
};

// Export for direct use
export { testCases };
