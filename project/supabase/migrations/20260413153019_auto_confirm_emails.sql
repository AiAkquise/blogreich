/*
  # Auto-confirm email addresses on signup

  1. Changes
    - Creates a trigger function that automatically confirms email addresses
      when a new user is created in the auth.users table
    - This removes the need for users to click a confirmation link

  2. Important Notes
    - The trigger fires BEFORE INSERT so the user is created already confirmed
    - This effectively disables email confirmation for all new signups
*/

CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'auto_confirm_email_trigger'
  ) THEN
    CREATE TRIGGER auto_confirm_email_trigger
      BEFORE INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_confirm_email();
  END IF;
END $$;
