-- Create a mock user in the auth.users table with the fixed UUID used by the mock auth service
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
)
VALUES (
  '11111111-1111-4111-a111-111111111111', -- This is the fixed UUID used in authService.ts
  'mock@example.com',
  '$2a$10$abcdefghijklmnopqrstuvwxyz123456789', -- A dummy bcrypt hash
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
)
ON CONFLICT (id) DO NOTHING; -- Skip if the user already exists

-- Verify the user was created
SELECT id, email, role FROM auth.users WHERE id = '11111111-1111-4111-a111-111111111111'; 