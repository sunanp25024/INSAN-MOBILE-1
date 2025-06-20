-- Supabase Schema for INSAN-MOBILE-1 Application

-- Enable Row Level Security (RLS) for all tables
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('MasterAdmin', 'Admin', 'PIC', 'Kurir')),
  email VARCHAR(255),
  phone VARCHAR(50),
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  hub_id UUID,
  area_id UUID,
  wilayah_id UUID
);

ALTER TABLE users REPLICA IDENTITY FULL;

-- Locations Table (Hierarchical: Wilayah > Area > Hub)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('wilayah', 'area', 'hub')),
  parent_id UUID REFERENCES locations(id),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE locations REPLICA IDENTITY FULL;

-- Packages Table
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resi_number VARCHAR(255) NOT NULL UNIQUE,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_phone VARCHAR(50),
  package_type VARCHAR(50) NOT NULL,
  is_cod BOOLEAN DEFAULT FALSE,
  cod_amount DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(50) NOT NULL CHECK (status IN ('assigned', 'in_transit', 'delivered', 'pending', 'returned')),
  courier_id UUID REFERENCES users(id),
  hub_id UUID REFERENCES locations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_date TIMESTAMP WITH TIME ZONE,
  delivery_photo_url TEXT,
  return_proof_url TEXT,
  notes TEXT
);

ALTER TABLE packages REPLICA IDENTITY FULL;

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE attendance_records REPLICA IDENTITY FULL;

-- Daily Package Inputs Table
CREATE TABLE IF NOT EXISTS daily_package_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  total_packages INTEGER NOT NULL,
  cod_packages INTEGER NOT NULL,
  non_cod_packages INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_package_inputs REPLICA IDENTITY FULL;

-- Delivery Activities Table
CREATE TABLE IF NOT EXISTS delivery_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  package_id UUID NOT NULL REFERENCES packages(id),
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('scan', 'delivery_update', 'return_update')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('in_transit', 'delivered', 'pending', 'returned')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location TEXT,
  photo_url TEXT,
  notes TEXT
);

ALTER TABLE delivery_activities REPLICA IDENTITY FULL;

-- Function to insert initial data
CREATE OR REPLACE FUNCTION insert_initial_data()
RETURNS VOID AS $$
DECLARE
  wilayah_jakarta UUID;
  wilayah_bandung UUID;
  area_jakarta_pusat UUID;
  area_bandung_kota UUID;
  hub_jakarta_thamrin UUID;
  hub_bandung_kota UUID;
BEGIN
  -- Insert Wilayah
  INSERT INTO locations (id, name, type, address)
  VALUES 
    (gen_random_uuid(), 'Jakarta', 'wilayah', 'DKI Jakarta')
  RETURNING id INTO wilayah_jakarta;
  
  INSERT INTO locations (id, name, type, address)
  VALUES 
    (gen_random_uuid(), 'Bandung', 'wilayah', 'Jawa Barat')
  RETURNING id INTO wilayah_bandung;
  
  -- Insert Area
  INSERT INTO locations (id, name, type, parent_id, address)
  VALUES 
    (gen_random_uuid(), 'Jakarta Pusat', 'area', wilayah_jakarta, 'Jakarta Pusat')
  RETURNING id INTO area_jakarta_pusat;
  
  INSERT INTO locations (id, name, type, parent_id, address)
  VALUES 
    (gen_random_uuid(), 'Bandung Kota', 'area', wilayah_bandung, 'Bandung Kota')
  RETURNING id INTO area_bandung_kota;
  
  -- Insert Hub
  INSERT INTO locations (id, name, type, parent_id, address)
  VALUES 
    (gen_random_uuid(), 'Jakarta Pusat Hub (Thamrin)', 'hub', area_jakarta_pusat, 'Jl. MH Thamrin No. 1, Jakarta Pusat')
  RETURNING id INTO hub_jakarta_thamrin;
  
  INSERT INTO locations (id, name, type, parent_id, address)
  VALUES 
    (gen_random_uuid(), 'Bandung Kota Hub (Kota)', 'hub', area_bandung_kota, 'Jl. Asia Afrika No. 1, Bandung')
  RETURNING id INTO hub_bandung_kota;
  
  -- Insert Users
  INSERT INTO users (username, password, name, role, email, phone, hub_id, area_id, wilayah_id)
  VALUES
    ('masteradmin', 'password123', 'Master Admin', 'MasterAdmin', 'masteradmin@example.com', '08123456789', NULL, NULL, NULL),
    ('admin', 'password123', 'Admin User', 'Admin', 'admin@example.com', '08123456790', NULL, NULL, wilayah_jakarta),
    ('pic', 'password123', 'PIC User', 'PIC', 'pic@example.com', '08123456791', hub_jakarta_thamrin, area_jakarta_pusat, wilayah_jakarta),
    ('kurir', 'password123', 'Budi Santoso', 'Kurir', 'kurir@example.com', '08123456792', hub_jakarta_thamrin, area_jakarta_pusat, wilayah_jakarta);

END;
$$ LANGUAGE plpgsql;

-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription TEXT,
  token TEXT,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('web', 'native')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE push_subscriptions REPLICA IDENTITY FULL;

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_package_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified for now - in production you'd want more granular policies)
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON locations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON packages FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON attendance_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON daily_package_inputs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON delivery_activities FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON push_subscriptions FOR ALL TO authenticated USING (true);

-- Select function to run it
-- SELECT insert_initial_data();