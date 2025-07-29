-- 05_profile_trigger.sql
-- Automatically create a profile when a user signs up

-- Function to create a profile for new users
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a user confirms their email
CREATE OR REPLACE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION create_profile_for_user();

-- Also handle cases where email is confirmed later
CREATE OR REPLACE TRIGGER confirm_profile_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION create_profile_for_user();
