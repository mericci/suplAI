-- Seed data for local development
-- Run with: supabase db reset (this will run migrations and seed)

-- Example: Insert test users
INSERT INTO public.users (id, email, name)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin User'),
  ('00000000-0000-0000-0000-000000000002', 'test@example.com', 'Test User')
ON CONFLICT (id) DO NOTHING;
