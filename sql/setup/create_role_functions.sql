/**
 * Create postgres functions to add/remove user's admin privileges
 * Call them like this: `SELECT remove_user_role('enter_uuid');`
 */

-- Function to set a user as Admin (removes 'Developer' if present)
CREATE OR REPLACE FUNCTION set_user_as_administrator(user_id uuid)
RETURNS void AS
$$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb('Administrator'::text))
    WHERE id = user_id;
END;
$$
LANGUAGE plpgsql SECURITY definer;

-- Function to set a user as Developer (removes 'Admin' if present)
CREATE OR REPLACE FUNCTION set_user_as_developer(user_id uuid)
RETURNS void AS
$$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb('Developer'::text))
    WHERE id = user_id;
END;
$$
LANGUAGE plpgsql SECURITY definer;

-- Function to remove the user's role
CREATE OR REPLACE FUNCTION remove_user_role(user_id uuid)
RETURNS void AS
$$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data - 'role'
    WHERE id = user_id;
END;
$$
LANGUAGE plpgsql SECURITY definer;

-- Create restrictive role policies to block non-admin access
REVOKE EXECUTE ON FUNCTION public.remove_user_role FROM public;
REVOKE EXECUTE ON FUNCTION public.set_user_as_administrator FROM public;
REVOKE EXECUTE ON FUNCTION public.set_user_as_developer FROM public;
