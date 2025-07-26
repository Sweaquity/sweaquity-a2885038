-- Enable Row Level Security on tables that currently don't have it
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

-- Jobs table policies
CREATE POLICY "Business owners can manage their jobs" ON public.jobs
FOR ALL USING (business_id = auth.uid());

CREATE POLICY "Admins can view all jobs" ON public.jobs
FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Legal jurisdictions policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view legal jurisdictions" ON public.legal_jurisdictions
FOR SELECT USING (true);

CREATE POLICY "Admins can manage legal jurisdictions" ON public.legal_jurisdictions
FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Document revisions policies (audit trail access)
CREATE POLICY "Users can view revisions of their documents" ON public.document_revisions
FOR SELECT USING (
  document_id IN (
    SELECT id FROM legal_documents 
    WHERE business_id = auth.uid() OR jobseeker_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all document revisions" ON public.document_revisions
FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can create document revisions" ON public.document_revisions
FOR INSERT WITH CHECK (
  document_id IN (
    SELECT id FROM legal_documents 
    WHERE business_id = auth.uid() OR jobseeker_id = auth.uid()
  ) AND changed_by = auth.uid()
);

-- Document templates policies
CREATE POLICY "Authenticated users can view document templates" ON public.document_templates
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage document templates" ON public.document_templates
FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Documents policies
CREATE POLICY "Users can view their project documents" ON public.documents
FOR SELECT USING (
  (project_id IN (
    SELECT project_id FROM business_projects WHERE business_id = auth.uid()
  )) OR 
  (ticket_id IN (
    SELECT id FROM tickets WHERE reporter = auth.uid() OR assigned_to = auth.uid()
  )) OR
  uploaded_by = auth.uid()
);

CREATE POLICY "Users can upload documents to their projects" ON public.documents
FOR INSERT WITH CHECK (
  (project_id IN (
    SELECT project_id FROM business_projects WHERE business_id = auth.uid()
  )) OR
  uploaded_by = auth.uid()
);

CREATE POLICY "Admins can view all documents" ON public.documents
FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Recruiters policies
CREATE POLICY "Recruiters can manage their own data" ON public.recruiters
FOR ALL USING (id = auth.uid());

CREATE POLICY "Organization owners can view their recruiters" ON public.recruiters
FOR SELECT USING (
  organization_id IN (
    SELECT id FROM recruiter_organizations WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can view all recruiters" ON public.recruiters
FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Add admin audit access to existing tables
CREATE POLICY "Admins can view all document signatures" ON public.document_signatures
FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all document approvals" ON public.document_approvals
FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all time entries" ON public.time_entries
FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all job applications" ON public.job_applications
FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Update database functions to include proper search path
CREATE OR REPLACE FUNCTION public.delete_user_profile(user_type text, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    profile_data JSONB;
    business_data JSONB;
BEGIN
    -- Store profile and business data before deletion (for GDPR compliance)
    SELECT row_to_json(p)::jsonb INTO profile_data
    FROM profiles p
    WHERE p.id = delete_user_profile.user_id;

    SELECT row_to_json(b)::jsonb INTO business_data
    FROM businesses b
    WHERE b.businesses_id = delete_user_profile.user_id;

    INSERT INTO gdpr_deleted_data (user_id, user_type, data, deleted_at)
    VALUES (
        delete_user_profile.user_id, 
        user_type, 
        jsonb_build_object('profile', profile_data, 'business', business_data), 
        NOW()
    );

    -- Delete dependent records in cv_parsed_data before deleting user
    DELETE FROM cv_parsed_data 
    WHERE cv_parsed_data.user_id = delete_user_profile.user_id;

    -- Handle deletions based on user type
    IF user_type = 'job_seeker' THEN
        DELETE FROM job_applications 
        WHERE job_applications.user_id = delete_user_profile.user_id;

        DELETE FROM profiles 
        WHERE profiles.id = delete_user_profile.user_id;

    ELSIF user_type = 'business' THEN
        DELETE FROM job_applications 
        WHERE job_applications.project_id IN (
            SELECT business_projects.project_id 
            FROM business_projects 
            WHERE business_projects.business_id = delete_user_profile.user_id
        );

        DELETE FROM business_projects 
        WHERE business_projects.business_id = delete_user_profile.user_id;

        DELETE FROM businesses 
        WHERE businesses.businesses_id = delete_user_profile.user_id;
    END IF;

    -- Finally, delete the user from auth.users
    DELETE FROM auth.users 
    WHERE auth.users.id = delete_user_profile.user_id;

END;
$function$;

CREATE OR REPLACE FUNCTION public.soft_delete_ticket(ticket_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_ticket RECORD;
BEGIN
    -- Check for time entries
    IF EXISTS (SELECT 1 FROM time_entries WHERE time_entries.ticket_id = soft_delete_ticket.ticket_id) THEN
        RAISE EXCEPTION 'Cannot delete ticket with time entries';
        RETURN FALSE;
    END IF;
    
    -- Check ticket completion percentage
    SELECT INTO v_ticket * FROM tickets WHERE id = soft_delete_ticket.ticket_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket not found';
        RETURN FALSE;
    END IF;
    
    IF v_ticket.completion_percentage > 0 THEN
        RAISE EXCEPTION 'Cannot delete ticket with completion progress';
        RETURN FALSE;
    END IF;
    
    -- Insert into deleted_tickets table
    INSERT INTO deleted_tickets(
        original_id, title, description, status, priority, type,
        created_at, updated_at, due_date, assignee_id, reporter_id, 
        project_id, estimated_hours, completion_percentage, deleted_by
    )
    VALUES(
        v_ticket.id, 
        v_ticket.title, 
        v_ticket.description, 
        v_ticket.status, 
        v_ticket.priority, 
        COALESCE(v_ticket.ticket_type, 'task'),
        v_ticket.created_at, 
        v_ticket.updated_at, 
        v_ticket.due_date, 
        v_ticket.assigned_to, 
        COALESCE(v_ticket.created_by, v_ticket.reporter), 
        v_ticket.project_id,
        v_ticket.estimated_hours, 
        v_ticket.completion_percentage, 
        user_id
    );
    
    -- Update the ticket status to indicate it's been "deleted"
    UPDATE tickets 
    SET status = 'deleted'
    WHERE id = soft_delete_ticket.ticket_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
        RETURN FALSE;
END;
$function$;