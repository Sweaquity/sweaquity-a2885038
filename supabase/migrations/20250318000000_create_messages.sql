
-- Create messages table
create table if not exists public.user_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id),
  recipient_id uuid not null references auth.users(id),
  subject text not null,
  message text not null,
  related_ticket uuid references public.tickets(id),
  created_at timestamp with time zone default now(),
  read boolean not null default false
);

-- Add RLS policies
alter table public.user_messages enable row level security;

-- Allow users to see their own messages (sent or received)
create policy "Users can see their own messages"
  on public.user_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Allow users to insert new messages
create policy "Users can send messages"
  on public.user_messages for insert
  with check (auth.uid() = sender_id);

-- Allow users to mark their received messages as read
create policy "Users can mark their received messages as read"
  on public.user_messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Function to create messages table if it doesn't exist
create or replace function public.create_messages_table_if_not_exists()
returns void as $$
begin
  -- The function is empty as the actual creation is done in the migration
  -- This is just a placeholder for RPC calls from the frontend
  return;
end;
$$ language plpgsql security definer;

-- Grant access to authenticated users
grant execute on function public.create_messages_table_if_not_exists to authenticated;
