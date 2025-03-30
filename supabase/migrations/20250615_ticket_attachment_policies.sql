
-- Create RLS policies for ticket-attachments bucket to allow project owners to access their project's tickets
CREATE POLICY "Project owners and admins can access ticket attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ticket-attachments' AND
  (
    -- Check if the user is the project owner or a project member
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.project_id::text = storage.foldername(name)
      AND t.project_id IN (
        SELECT project_id FROM business_projects WHERE business_id = auth.uid()
      )
    )
    OR
    -- Check if the user is an admin
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
    OR
    -- Allow access to the user who reported the ticket
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id::text = storage.foldername(storage.foldername(name))
      AND t.reporter = auth.uid()
    )
  )
);

-- Add a policy to allow project owners to see ticket attachments
CREATE POLICY "Project owners can see ticket attachments" 
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ticket-attachments' AND
  (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN business_projects bp ON t.project_id = bp.project_id
      WHERE 
        storage.foldername(name) = bp.project_id::text AND
        bp.business_id = auth.uid()
    )
  )
);
