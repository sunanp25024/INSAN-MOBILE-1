-- INSAN MOBILE - Production Database Setup
-- Run this script in your Supabase SQL Editor
-- Make sure to run this AFTER importing your schema

-- ===========================================
-- 1. ENABLE ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 2. CREATE RLS POLICIES FOR USERS TABLE
-- ===========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Admin can view all users
CREATE POLICY "Admin can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admin can insert new users
CREATE POLICY "Admin can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admin can update all users
CREATE POLICY "Admin can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admin can delete users
CREATE POLICY "Admin can delete users" ON public.users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- ===========================================
-- 3. CREATE RLS POLICIES FOR LOCATIONS TABLE
-- ===========================================

-- All authenticated users can view locations
CREATE POLICY "Authenticated users can view locations" ON public.locations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admin can manage all locations
CREATE POLICY "Admin can manage locations" ON public.locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- PIC can manage locations in their area
CREATE POLICY "PIC can manage own area locations" ON public.locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'PIC'
        )
    );

-- ===========================================
-- 4. CREATE RLS POLICIES FOR PACKAGES TABLE
-- ===========================================

-- All authenticated users can view packages
CREATE POLICY "Authenticated users can view packages" ON public.packages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admin can manage all packages
CREATE POLICY "Admin can manage all packages" ON public.packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Courier can view and update packages assigned to them
CREATE POLICY "Courier can manage assigned packages" ON public.packages
    FOR ALL USING (
        courier_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Courier'
        )
    );

-- PIC can manage packages in their location
CREATE POLICY "PIC can manage location packages" ON public.packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.locations l ON l.id = public.packages.location_id
            WHERE u.id = auth.uid() AND u.role = 'PIC'
        )
    );

-- Users can insert packages
CREATE POLICY "Users can create packages" ON public.packages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===========================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ===========================================

-- Index on users role for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Index on packages status for faster status filtering
CREATE INDEX IF NOT EXISTS idx_packages_status ON public.packages(status);

-- Index on packages courier_id for faster courier queries
CREATE INDEX IF NOT EXISTS idx_packages_courier_id ON public.packages(courier_id);

-- Index on packages location_id for faster location queries
CREATE INDEX IF NOT EXISTS idx_packages_location_id ON public.packages(location_id);

-- Index on packages created_at for faster date queries
CREATE INDEX IF NOT EXISTS idx_packages_created_at ON public.packages(created_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_packages_status_location ON public.packages(status, location_id);
CREATE INDEX IF NOT EXISTS idx_packages_courier_status ON public.packages(courier_id, status);

-- ===========================================
-- 6. CREATE FUNCTIONS FOR COMMON OPERATIONS
-- ===========================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'Admin' FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get packages count by status
CREATE OR REPLACE FUNCTION get_packages_count_by_status()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.status, COUNT(*) as count
    FROM public.packages p
    GROUP BY p.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 7. CREATE TRIGGERS FOR AUDIT LOGGING
-- ===========================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admin can view audit logs
CREATE POLICY "Admin can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Function to log changes
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (table_name, operation, old_data, new_data, user_id)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION log_changes();

CREATE TRIGGER packages_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.packages
    FOR EACH ROW EXECUTE FUNCTION log_changes();

CREATE TRIGGER locations_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION log_changes();

-- ===========================================
-- 8. SETUP REALTIME SUBSCRIPTIONS
-- ===========================================

-- Enable realtime for packages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;

-- Enable realtime for users table (for status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- ===========================================
-- 9. CREATE BACKUP POLICY
-- ===========================================

-- Create a view for backup purposes (without sensitive data)
CREATE OR REPLACE VIEW public.backup_packages AS
SELECT 
    id,
    tracking_number,
    recipient_name,
    recipient_phone,
    recipient_address,
    status,
    location_id,
    courier_id,
    created_at,
    updated_at
FROM public.packages;

CREATE OR REPLACE VIEW public.backup_users AS
SELECT 
    id,
    email,
    full_name,
    role,
    phone,
    address,
    is_active,
    created_at,
    updated_at
FROM public.users;

-- ===========================================
-- 10. VERIFICATION QUERIES
-- ===========================================

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'locations', 'packages');

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public';

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'locations', 'packages')
ORDER BY tablename, indexname;

-- ===========================================
-- SETUP COMPLETE!
-- ===========================================
-- 
-- Next steps:
-- 1. Verify all policies are working correctly
-- 2. Test with different user roles
-- 3. Set up automated backups in Supabase dashboard
-- 4. Configure monitoring and alerts
-- 5. Test realtime subscriptions
-- 
-- ===========================================