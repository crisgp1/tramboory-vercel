-- Migration to consolidate MongoDB collections into Supabase
-- This migration creates tables for: users, system_config, reservations, finances, event_themes, packages, food_options, extra_services

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'proveedor', 'vendedor', 'gerente')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system_config table
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rest_day INTEGER NOT NULL DEFAULT 1 CHECK (rest_day >= 0 AND rest_day <= 6),
  rest_day_fee DECIMAL(10,2) NOT NULL DEFAULT 500.00 CHECK (rest_day_fee >= 0),
  business_hours_start TIME NOT NULL DEFAULT '09:00',
  business_hours_end TIME NOT NULL DEFAULT '18:00',
  advance_booking_days INTEGER NOT NULL DEFAULT 7 CHECK (advance_booking_days >= 1),
  max_concurrent_events INTEGER NOT NULL DEFAULT 3 CHECK (max_concurrent_events >= 1),
  default_event_duration INTEGER NOT NULL DEFAULT 4 CHECK (default_event_duration >= 1 AND default_event_duration <= 24),
  time_blocks JSONB DEFAULT '[]'::jsonb,
  rest_days JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  pricing_weekday DECIMAL(10,2) NOT NULL CHECK (pricing_weekday >= 0),
  pricing_weekend DECIMAL(10,2) NOT NULL CHECK (pricing_weekend >= 0),
  pricing_holiday DECIMAL(10,2) NOT NULL CHECK (pricing_holiday >= 0),
  duration INTEGER NOT NULL CHECK (duration >= 1 AND duration <= 24),
  max_guests INTEGER NOT NULL CHECK (max_guests >= 1),
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create food_options table
CREATE TABLE IF NOT EXISTS public.food_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  extras JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create extra_services table
CREATE TABLE IF NOT EXISTS public.extra_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_themes table
CREATE TABLE IF NOT EXISTS public.event_themes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  packages JSONB DEFAULT '[]'::jsonb,
  themes TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Package information
  package_config_id UUID REFERENCES public.packages(id),
  package_name TEXT NOT NULL,
  package_max_guests INTEGER NOT NULL,
  package_base_price DECIMAL(10,2) NOT NULL,
  
  -- Event date and time
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  event_duration INTEGER DEFAULT 4,
  event_block JSONB,
  is_rest_day BOOLEAN DEFAULT false,
  rest_day_fee DECIMAL(10,2) DEFAULT 0,
  
  -- Food option
  food_option_config_id UUID REFERENCES public.food_options(id),
  food_option_name TEXT,
  food_option_base_price DECIMAL(10,2) DEFAULT 0,
  food_option_selected_extras JSONB DEFAULT '[]'::jsonb,
  
  -- Extra services
  extra_services JSONB DEFAULT '[]'::jsonb,
  
  -- Event theme
  event_theme_config_id UUID REFERENCES public.event_themes(id),
  event_theme_name TEXT,
  event_theme_selected_package JSONB,
  event_theme_selected_theme TEXT,
  
  -- Customer data
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  
  -- Child data
  child_name TEXT NOT NULL,
  child_age INTEGER NOT NULL CHECK (child_age >= 1 AND child_age <= 18),
  
  -- Special comments
  special_comments TEXT,
  
  -- Pricing calculations
  pricing_package_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  pricing_food_price DECIMAL(10,2) DEFAULT 0,
  pricing_extras_price DECIMAL(10,2) DEFAULT 0,
  pricing_theme_price DECIMAL(10,2) DEFAULT 0,
  pricing_rest_day_fee DECIMAL(10,2) DEFAULT 0,
  pricing_subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  pricing_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  
  -- Payment information
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  payment_date TIMESTAMPTZ,
  payment_notes TEXT,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create finances table
CREATE TABLE IF NOT EXISTS public.finances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Transaction type
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  
  -- Basic information
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('reservation', 'operational', 'salary', 'other')),
  subcategory TEXT,
  
  -- Reservation relation (optional)
  reservation_id UUID REFERENCES public.reservations(id),
  reservation_customer_name TEXT,
  reservation_event_date DATE,
  
  -- Tags for better organization
  tags TEXT[] DEFAULT '{}',
  
  -- Additional information
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'check', 'other')),
  reference TEXT,
  notes TEXT,
  
  -- Transaction status
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  -- User who created the record
  created_by UUID REFERENCES public.user_profiles(id),
  
  -- Hierarchical structure for parent-child finances
  parent_id UUID REFERENCES public.finances(id),
  is_system_generated BOOLEAN DEFAULT false,
  is_editable BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

CREATE INDEX IF NOT EXISTS idx_packages_is_active ON public.packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_name ON public.packages(name);

CREATE INDEX IF NOT EXISTS idx_food_options_is_active ON public.food_options(is_active);
CREATE INDEX IF NOT EXISTS idx_extra_services_is_active ON public.extra_services(is_active);
CREATE INDEX IF NOT EXISTS idx_event_themes_is_active ON public.event_themes(is_active);

CREATE INDEX IF NOT EXISTS idx_reservations_event_date ON public.reservations(event_date);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_email ON public.reservations(customer_email);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_finances_type ON public.finances(type);
CREATE INDEX IF NOT EXISTS idx_finances_category ON public.finances(category);
CREATE INDEX IF NOT EXISTS idx_finances_date ON public.finances(date DESC);
CREATE INDEX IF NOT EXISTS idx_finances_status ON public.finances(status);
CREATE INDEX IF NOT EXISTS idx_finances_reservation_id ON public.finances(reservation_id);
CREATE INDEX IF NOT EXISTS idx_finances_parent_id ON public.finances(parent_id);
CREATE INDEX IF NOT EXISTS idx_finances_created_at ON public.finances(created_at DESC);

-- Create composite indexes
CREATE INDEX IF NOT EXISTS idx_finances_type_date ON public.finances(type, date DESC);
CREATE INDEX IF NOT EXISTS idx_finances_category_date ON public.finances(category, date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User profiles: users can only see/edit their own profile, admins can see all
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System config: only admins can access
CREATE POLICY "Only admins can access system config" ON public.system_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Packages, food options, extra services, event themes: admins can manage, others can view active ones
CREATE POLICY "Everyone can view active packages" ON public.packages
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gerente')
  ));

CREATE POLICY "Admins can manage packages" ON public.packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Similar policies for other configuration tables
CREATE POLICY "Everyone can view active food options" ON public.food_options
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gerente')
  ));

CREATE POLICY "Admins can manage food options" ON public.food_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Everyone can view active extra services" ON public.extra_services
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gerente')
  ));

CREATE POLICY "Admins can manage extra services" ON public.extra_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Everyone can view active event themes" ON public.event_themes
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gerente')
  ));

CREATE POLICY "Admins can manage event themes" ON public.event_themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reservations: customers can view their own, staff can view all
CREATE POLICY "Customers can view own reservations" ON public.reservations
  FOR SELECT USING (
    customer_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can view all reservations" ON public.reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'vendedor')
    )
  );

CREATE POLICY "Staff can manage reservations" ON public.reservations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'vendedor')
    )
  );

-- Finances: only staff can access
CREATE POLICY "Staff can access finances" ON public.finances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'gerente')
    )
  );

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.system_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.food_options
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.extra_services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.event_themes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.finances
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();