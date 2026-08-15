CREATE OR REPLACE FUNCTION public.is_setup_complete()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM auth.users LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_setup_complete() TO anon, authenticated;
