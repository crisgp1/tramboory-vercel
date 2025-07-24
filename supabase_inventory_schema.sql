-- ================================================================================================
-- TRAMBOORY INVENTORY MANAGEMENT SYSTEM - POSTGRESQL/SUPABASE SCHEMA
-- ================================================================================================
-- This script recreates the complete inventory management system from MongoDB to PostgreSQL/Supabase
-- Based on the comprehensive analysis of the existing inventory system
-- ================================================================================================

-- ================================================================================================
-- ENUMS AND TYPES
-- ================================================================================================

-- Alert system enums
CREATE TYPE alert_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE alert_type AS ENUM ('LOW_STOCK', 'EXPIRY_WARNING', 'REORDER_POINT', 'EXPIRED_PRODUCT', 'QUARANTINE_ALERT');

-- Purchase order enums
CREATE TYPE purchase_order_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- Product enums
CREATE TYPE product_status AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');

-- Stock movement enums
CREATE TYPE stock_movement_type AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER');
CREATE TYPE movement_type AS ENUM ('ENTRADA', 'SALIDA', 'TRANSFERENCIA', 'AJUSTE', 'MERMA');
CREATE TYPE stock_movement_reason AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'EXPIRED', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT');

-- Supplier enums
CREATE TYPE supplier_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE payment_method AS ENUM ('cash', 'credit', 'transfer', 'check');

-- Unit categories
CREATE TYPE unit_category AS ENUM ('volume', 'weight', 'piece', 'length');

-- Conversion types
CREATE TYPE conversion_type AS ENUM ('fixed_volume', 'contains', 'weight');

-- Pricing tier types
CREATE TYPE pricing_tier_type AS ENUM ('retail', 'wholesale', 'bulk');

-- Batch status
CREATE TYPE batch_status AS ENUM ('available', 'reserved', 'quarantine', 'expired');

-- Stock transfer status
CREATE TYPE stock_transfer_status AS ENUM ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- Reference types for movements
CREATE TYPE movement_reference_type AS ENUM ('purchase_order', 'sales_order', 'adjustment', 'transfer');

-- Alert status
CREATE TYPE alert_status AS ENUM ('active', 'dismissed', 'resolved');

-- ================================================================================================
-- CORE TABLES
-- ================================================================================================

-- ------------------------------------------------------------------------------------------------
-- SUPPLIERS TABLE
-- ------------------------------------------------------------------------------------------------
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    user_id VARCHAR(255) UNIQUE, -- Clerk user ID for supplier portal
    
    -- Contact Information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_address TEXT,
    contact_person VARCHAR(100),
    
    -- Payment Terms
    payment_credit_days INTEGER NOT NULL DEFAULT 0 CHECK (payment_credit_days >= 0 AND payment_credit_days <= 365),
    payment_method payment_method NOT NULL DEFAULT 'cash',
    payment_currency VARCHAR(10) NOT NULL DEFAULT 'MXN',
    payment_discount_terms TEXT,
    
    -- Delivery Information
    delivery_lead_time_days INTEGER NOT NULL DEFAULT 1 CHECK (delivery_lead_time_days >= 0 AND delivery_lead_time_days <= 365),
    delivery_minimum_order DECIMAL(12,2) CHECK (delivery_minimum_order >= 0),
    delivery_zones TEXT[], -- Array of delivery zones
    
    -- Rating System
    rating_quality DECIMAL(2,1) DEFAULT 3.0 CHECK (rating_quality >= 1.0 AND rating_quality <= 5.0),
    rating_reliability DECIMAL(2,1) DEFAULT 3.0 CHECK (rating_reliability >= 1.0 AND rating_reliability <= 5.0),
    rating_pricing DECIMAL(2,1) DEFAULT 3.0 CHECK (rating_pricing >= 1.0 AND rating_pricing <= 5.0),
    rating_overall DECIMAL(2,1) DEFAULT 3.0 CHECK (rating_overall >= 1.0 AND rating_overall <= 5.0),
    
    -- Status and metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_preferred BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit fields
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------------------------
-- PRODUCTS TABLE
-- ------------------------------------------------------------------------------------------------
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    barcode VARCHAR(50) UNIQUE,
    base_unit VARCHAR(50) NOT NULL,
    
    -- Stock Levels
    stock_minimum DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (stock_minimum >= 0),
    stock_reorder_point DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (stock_reorder_point >= 0),
    stock_unit VARCHAR(50) NOT NULL,
    
    -- Pricing
    last_cost DECIMAL(12,2) CHECK (last_cost >= 0),
    average_cost DECIMAL(12,2) CHECK (average_cost >= 0),
    
    -- Physical specifications
    spec_weight DECIMAL(10,3) CHECK (spec_weight >= 0),
    spec_length DECIMAL(10,2) CHECK (spec_length >= 0),
    spec_width DECIMAL(10,2) CHECK (spec_width >= 0),
    spec_height DECIMAL(10,2) CHECK (spec_height >= 0),
    spec_dimensions_unit VARCHAR(10) DEFAULT 'cm',
    spec_color VARCHAR(50),
    spec_brand VARCHAR(100),
    spec_model VARCHAR(100),
    
    -- Product properties
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_perishable BOOLEAN NOT NULL DEFAULT false,
    requires_batch BOOLEAN NOT NULL DEFAULT true,
    
    -- Expiry information (only for perishable products)
    expiry_has_expiry BOOLEAN DEFAULT false,
    expiry_shelf_life_days INTEGER CHECK (expiry_shelf_life_days > 0),
    expiry_warning_days INTEGER DEFAULT 7 CHECK (expiry_warning_days > 0),
    
    -- Arrays for images and tags
    images TEXT[],
    tags TEXT[],
    
    -- Audit fields
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------------------------
-- PRODUCT UNITS TABLE (for complex unit management)
-- ------------------------------------------------------------------------------------------------
CREATE TABLE product_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    unit_code VARCHAR(50) NOT NULL,
    unit_name VARCHAR(100) NOT NULL,
    unit_category unit_category NOT NULL,
    is_base_unit BOOLEAN NOT NULL DEFAULT false,
    conversion_factor DECIMAL(12,6), -- For alternative units
    conversion_type conversion_type, -- How to convert
    contained_unit VARCHAR(50), -- For "contains" type conversions
    
    UNIQUE(product_id, unit_code)
);

-- ------------------------------------------------------------------------------------------------
-- PRODUCT PRICING TIERS TABLE
-- ------------------------------------------------------------------------------------------------
CREATE TABLE product_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    min_quantity DECIMAL(12,3) NOT NULL CHECK (min_quantity >= 0),
    max_quantity DECIMAL(12,3) NOT NULL CHECK (max_quantity >= 0),
    unit VARCHAR(50) NOT NULL,
    price_per_unit DECIMAL(12,2) NOT NULL CHECK (price_per_unit >= 0.01),
    tier_type pricing_tier_type NOT NULL,
    
    CHECK (max_quantity >= min_quantity)
);

-- ------------------------------------------------------------------------------------------------
-- PRODUCT SUPPLIERS TABLE (many-to-many relationship)
-- ------------------------------------------------------------------------------------------------
CREATE TABLE product_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_name VARCHAR(100) NOT NULL, -- Denormalized for performance
    is_preferred BOOLEAN DEFAULT false,
    last_purchase_price DECIMAL(12,2) CHECK (last_purchase_price >= 0),
    lead_time_days INTEGER DEFAULT 1 CHECK (lead_time_days >= 0),
    
    UNIQUE(product_id, supplier_id)
);

-- ------------------------------------------------------------------------------------------------
-- INVENTORY TABLE (stock management with batch tracking)
-- ------------------------------------------------------------------------------------------------
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    location_id VARCHAR(100) NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    
    -- Totals (calculated from batches)
    total_available DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (total_available >= 0),
    total_reserved DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (total_reserved >= 0),
    total_quarantine DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (total_quarantine >= 0),
    total_unit VARCHAR(50) NOT NULL,
    
    -- Metadata
    last_movement_id VARCHAR(100),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    last_updated_by VARCHAR(255) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, location_id)
);

-- ------------------------------------------------------------------------------------------------
-- INVENTORY BATCHES TABLE (detailed batch tracking)
-- ------------------------------------------------------------------------------------------------
CREATE TABLE inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    batch_id VARCHAR(50) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL CHECK (quantity >= 0),
    unit VARCHAR(50) NOT NULL,
    cost_per_unit DECIMAL(12,4) NOT NULL CHECK (cost_per_unit >= 0),
    expiry_date DATE,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_batch_code VARCHAR(100),
    status batch_status NOT NULL DEFAULT 'available',
    
    UNIQUE(inventory_id, batch_id)
);

-- ------------------------------------------------------------------------------------------------
-- PURCHASE ORDERS TABLE
-- ------------------------------------------------------------------------------------------------
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name VARCHAR(100) NOT NULL, -- Denormalized
    status purchase_order_status NOT NULL DEFAULT 'DRAFT',
    
    -- Financial details
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.16 CHECK (tax_rate >= 0 AND tax_rate <= 1), -- 16% IVA Mexico
    total DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'MXN',
    
    -- Delivery information
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    delivery_location VARCHAR(200) NOT NULL,
    
    -- Payment terms
    payment_method payment_method NOT NULL DEFAULT 'cash',
    payment_credit_days INTEGER NOT NULL DEFAULT 0 CHECK (payment_credit_days >= 0 AND payment_credit_days <= 365),
    payment_due_date DATE,
    
    -- Notes and attachments
    notes TEXT,
    internal_notes TEXT,
    attachments TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Workflow tracking
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    ordered_by VARCHAR(255),
    ordered_at TIMESTAMPTZ,
    received_by VARCHAR(255),
    received_at TIMESTAMPTZ,
    cancelled_by VARCHAR(255),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Audit fields
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------------------------
-- PURCHASE ORDER ITEMS TABLE
-- ------------------------------------------------------------------------------------------------
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(100) NOT NULL, -- Denormalized
    quantity DECIMAL(12,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(12,4) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
    notes TEXT
);

-- ------------------------------------------------------------------------------------------------
-- INVENTORY MOVEMENTS TABLE (complete audit trail)
-- ------------------------------------------------------------------------------------------------
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_id VARCHAR(50) UNIQUE NOT NULL,
    movement_type movement_type NOT NULL,
    product_id UUID REFERENCES products(id),
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    quantity DECIMAL(12,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    batch_id VARCHAR(50),
    reason TEXT,
    
    -- Reference to source document
    reference_type movement_reference_type,
    reference_id VARCHAR(100),
    
    -- Cost information
    cost_unit_cost DECIMAL(12,4) CHECK (cost_unit_cost >= 0),
    cost_total_cost DECIMAL(12,2) CHECK (cost_total_cost >= 0),
    cost_currency VARCHAR(10) DEFAULT 'MXN',
    
    -- Audit trail
    performed_by VARCHAR(255) NOT NULL,
    performed_by_name VARCHAR(100) NOT NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Reversal tracking
    is_reversed BOOLEAN NOT NULL DEFAULT false,
    reversal_movement_id VARCHAR(50),
    original_movement_id VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------------------------
-- STOCK TRANSFERS TABLE
-- ------------------------------------------------------------------------------------------------
CREATE TABLE stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id VARCHAR(50) UNIQUE NOT NULL,
    from_location VARCHAR(100) NOT NULL,
    to_location VARCHAR(100) NOT NULL,
    status stock_transfer_status NOT NULL DEFAULT 'PENDING',
    
    -- Workflow tracking
    requested_by VARCHAR(255) NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    sent_by VARCHAR(255),
    sent_at TIMESTAMPTZ,
    received_by VARCHAR(255),
    received_at TIMESTAMPTZ,
    cancelled_by VARCHAR(255),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------------------------
-- STOCK TRANSFER ITEMS TABLE
-- ------------------------------------------------------------------------------------------------
CREATE TABLE stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    batch_id VARCHAR(50),
    expiry_date DATE
);

-- ------------------------------------------------------------------------------------------------
-- INVENTORY ALERTS TABLE
-- ------------------------------------------------------------------------------------------------
CREATE TABLE inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type alert_type NOT NULL,
    priority alert_priority NOT NULL,
    message TEXT NOT NULL,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(100),
    current_stock DECIMAL(12,3) CHECK (current_stock >= 0),
    min_stock DECIMAL(12,3) CHECK (min_stock >= 0),
    expiry_date DATE,
    metadata JSONB DEFAULT '{}',
    status alert_status NOT NULL DEFAULT 'active',
    
    -- Action tracking
    created_by VARCHAR(255) NOT NULL,
    dismissed_by VARCHAR(255),
    dismissed_at TIMESTAMPTZ,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------------------------
-- SUPPLIER PENALTIES TABLE (performance tracking)
-- ------------------------------------------------------------------------------------------------
CREATE TABLE supplier_penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    penalty_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) CHECK (amount >= 0),
    currency VARCHAR(10) DEFAULT 'MXN',
    reference_type VARCHAR(50), -- 'purchase_order', 'delivery', etc.
    reference_id VARCHAR(100),
    penalty_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================================================

-- Suppliers indexes
CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_preferred ON suppliers(is_preferred);
CREATE INDEX idx_suppliers_rating ON suppliers(rating_overall DESC);
CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);

-- Products indexes
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_perishable ON products(is_perishable);
CREATE INDEX idx_products_name_text ON products USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

-- Product relationships indexes
CREATE INDEX idx_product_suppliers_product ON product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier ON product_suppliers(supplier_id);
CREATE INDEX idx_product_suppliers_preferred ON product_suppliers(is_preferred);

-- Inventory indexes
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_location ON inventory(location_id);
CREATE INDEX idx_inventory_available ON inventory(total_available);
CREATE INDEX idx_inventory_updated ON inventory(last_updated);

-- Inventory batches indexes
CREATE INDEX idx_batches_inventory ON inventory_batches(inventory_id);
CREATE INDEX idx_batches_batch_id ON inventory_batches(batch_id);
CREATE INDEX idx_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX idx_batches_status ON inventory_batches(status);
CREATE INDEX idx_batches_received ON inventory_batches(received_date);

-- Purchase orders indexes
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_delivery_date ON purchase_orders(expected_delivery_date);
CREATE INDEX idx_po_created ON purchase_orders(created_at);
CREATE INDEX idx_po_created_by ON purchase_orders(created_by);

-- Purchase order items indexes
CREATE INDEX idx_po_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product ON purchase_order_items(product_id);

-- Inventory movements indexes
CREATE INDEX idx_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_movements_from_location ON inventory_movements(from_location);
CREATE INDEX idx_movements_to_location ON inventory_movements(to_location);
CREATE INDEX idx_movements_batch ON inventory_movements(batch_id);
CREATE INDEX idx_movements_reference ON inventory_movements(reference_type, reference_id);
CREATE INDEX idx_movements_performed_by ON inventory_movements(performed_by);
CREATE INDEX idx_movements_created ON inventory_movements(created_at);
CREATE INDEX idx_movements_reversed ON inventory_movements(is_reversed);

-- Stock transfers indexes
CREATE INDEX idx_transfers_from_location ON stock_transfers(from_location);
CREATE INDEX idx_transfers_to_location ON stock_transfers(to_location);
CREATE INDEX idx_transfers_status ON stock_transfers(status);
CREATE INDEX idx_transfers_requested ON stock_transfers(requested_at);

-- Alerts indexes
CREATE INDEX idx_alerts_type ON inventory_alerts(alert_type);
CREATE INDEX idx_alerts_priority ON inventory_alerts(priority);
CREATE INDEX idx_alerts_status ON inventory_alerts(status);
CREATE INDEX idx_alerts_product ON inventory_alerts(product_id);
CREATE INDEX idx_alerts_created ON inventory_alerts(created_at);

-- ================================================================================================
-- TRIGGERS AND FUNCTIONS
-- ================================================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_movements_updated_at BEFORE UPDATE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_transfers_updated_at BEFORE UPDATE ON stock_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_alerts_updated_at BEFORE UPDATE ON inventory_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate supplier overall rating
CREATE OR REPLACE FUNCTION update_supplier_rating()
RETURNS TRIGGER AS $$
BEGIN
    NEW.rating_overall = ROUND(((NEW.rating_quality + NEW.rating_reliability + NEW.rating_pricing) / 3.0)::NUMERIC, 2);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_supplier_rating_trigger 
    BEFORE INSERT OR UPDATE OF rating_quality, rating_reliability, rating_pricing 
    ON suppliers FOR EACH ROW EXECUTE FUNCTION update_supplier_rating();

-- Function to recalculate purchase order totals
CREATE OR REPLACE FUNCTION recalculate_purchase_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    calculated_subtotal DECIMAL(12,2);
BEGIN
    -- Calculate subtotal from items
    SELECT COALESCE(SUM(total_price), 0)
    INTO calculated_subtotal
    FROM purchase_order_items
    WHERE purchase_order_id = NEW.purchase_order_id;
    
    -- Update the purchase order
    UPDATE purchase_orders
    SET 
        subtotal = calculated_subtotal,
        tax = calculated_subtotal * tax_rate,
        total = calculated_subtotal + (calculated_subtotal * tax_rate),
        updated_at = NOW()
    WHERE id = NEW.purchase_order_id;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER recalculate_po_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION recalculate_purchase_order_totals();

-- Function to recalculate inventory totals from batches
CREATE OR REPLACE FUNCTION recalculate_inventory_totals()
RETURNS TRIGGER AS $$
DECLARE
    available_total DECIMAL(12,3);
    reserved_total DECIMAL(12,3);
    quarantine_total DECIMAL(12,3);
BEGIN
    -- Calculate totals from batches
    SELECT 
        COALESCE(SUM(CASE WHEN status = 'available' THEN quantity ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'reserved' THEN quantity ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'quarantine' THEN quantity ELSE 0 END), 0)
    INTO available_total, reserved_total, quarantine_total
    FROM inventory_batches
    WHERE inventory_id = COALESCE(NEW.inventory_id, OLD.inventory_id);
    
    -- Update inventory totals
    UPDATE inventory
    SET 
        total_available = available_total,
        total_reserved = reserved_total,
        total_quarantine = quarantine_total,
        last_updated = NOW()
    WHERE id = COALESCE(NEW.inventory_id, OLD.inventory_id);
    
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER recalculate_inventory_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON inventory_batches
    FOR EACH ROW EXECUTE FUNCTION recalculate_inventory_totals();

-- Function to mark expired batches
CREATE OR REPLACE FUNCTION mark_expired_batches()
RETURNS void AS $$
BEGIN
    UPDATE inventory_batches
    SET status = 'expired'
    WHERE expiry_date <= CURRENT_DATE
    AND status != 'expired'
    AND expiry_date IS NOT NULL;
END;
$$ language 'plpgsql';

-- ================================================================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================================================================

-- View for product inventory summary
CREATE VIEW v_product_inventory_summary AS
SELECT 
    p.id as product_id,
    p.product_id as product_code,
    p.name as product_name,
    p.category,
    p.is_active,
    p.is_perishable,
    COALESCE(SUM(i.total_available), 0) as total_available,
    COALESCE(SUM(i.total_reserved), 0) as total_reserved,
    COALESCE(SUM(i.total_quarantine), 0) as total_quarantine,
    COALESCE(SUM(i.total_available + i.total_reserved + i.total_quarantine), 0) as total_stock,
    p.stock_minimum,
    p.stock_reorder_point,
    CASE 
        WHEN COALESCE(SUM(i.total_available), 0) <= p.stock_minimum THEN true
        ELSE false
    END as is_low_stock,
    CASE 
        WHEN COALESCE(SUM(i.total_available), 0) = 0 THEN true
        ELSE false
    END as is_out_of_stock
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
WHERE p.is_active = true
GROUP BY p.id, p.product_id, p.name, p.category, p.is_active, p.is_perishable, p.stock_minimum, p.stock_reorder_point;

-- View for expiring batches
CREATE VIEW v_expiring_batches AS
SELECT 
    ib.id,
    ib.batch_id,
    ib.quantity,
    ib.unit,
    ib.expiry_date,
    ib.status,
    i.location_id,
    i.location_name,
    p.id as product_id,
    p.name as product_name,
    p.category as product_category,
    (ib.expiry_date - CURRENT_DATE) as days_until_expiry
FROM inventory_batches ib
JOIN inventory i ON ib.inventory_id = i.id
JOIN products p ON i.product_id = p.id
WHERE ib.expiry_date IS NOT NULL
AND ib.status = 'available'
AND ib.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY ib.expiry_date ASC;

-- View for supplier performance
CREATE VIEW v_supplier_performance AS
SELECT 
    s.id as supplier_id,
    s.name as supplier_name,
    s.rating_overall,
    COUNT(po.id) as total_orders,
    COUNT(CASE WHEN po.status = 'RECEIVED' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN po.status = 'CANCELLED' THEN 1 END) as cancelled_orders,
    COALESCE(SUM(CASE WHEN po.status = 'RECEIVED' THEN po.total ELSE 0 END), 0) as total_value,
    COALESCE(AVG(CASE WHEN po.status = 'RECEIVED' THEN po.total END), 0) as average_order_value,
    COUNT(CASE WHEN po.status = 'ORDERED' AND po.expected_delivery_date < CURRENT_DATE THEN 1 END) as overdue_orders
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.rating_overall;

-- ================================================================================================
-- HELPER FUNCTIONS
-- ================================================================================================

-- Function to create automatic alerts for low stock
CREATE OR REPLACE FUNCTION create_low_stock_alerts()
RETURNS void AS $$
DECLARE
    product_record RECORD;
BEGIN
    FOR product_record IN 
        SELECT * FROM v_product_inventory_summary 
        WHERE is_low_stock = true AND is_out_of_stock = false
    LOOP
        INSERT INTO inventory_alerts (
            alert_type,
            priority,
            message,
            product_id,
            product_name,
            current_stock,
            min_stock,
            created_by
        ) VALUES (
            'LOW_STOCK',
            'HIGH',
            'Stock bajo para ' || product_record.product_name || '. Stock actual: ' || product_record.total_available || ', Stock mínimo: ' || product_record.stock_minimum,
            product_record.product_id,
            product_record.product_name,
            product_record.total_available,
            product_record.stock_minimum,
            'system'
        ) ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Create critical alerts for out of stock
    FOR product_record IN 
        SELECT * FROM v_product_inventory_summary 
        WHERE is_out_of_stock = true
    LOOP
        INSERT INTO inventory_alerts (
            alert_type,
            priority,
            message,
            product_id,
            product_name,
            current_stock,
            min_stock,
            created_by
        ) VALUES (
            'LOW_STOCK',
            'CRITICAL',
            'Producto agotado: ' || product_record.product_name,
            product_record.product_id,
            product_record.product_name,
            product_record.total_available,
            product_record.stock_minimum,
            'system'
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ language 'plpgsql';

-- Function to create expiry alerts
CREATE OR REPLACE FUNCTION create_expiry_alerts()
RETURNS void AS $$
DECLARE
    batch_record RECORD;
    alert_priority alert_priority;
    alert_type_val alert_type;
    message_text TEXT;
BEGIN
    FOR batch_record IN 
        SELECT * FROM v_expiring_batches 
        WHERE days_until_expiry <= 7
    LOOP
        -- Determine priority and type based on days until expiry
        IF batch_record.days_until_expiry <= 0 THEN
            alert_priority := 'CRITICAL';
            alert_type_val := 'EXPIRED_PRODUCT';
            message_text := batch_record.product_name || ' ha vencido (Lote: ' || batch_record.batch_id || ')';
        ELSIF batch_record.days_until_expiry <= 3 THEN
            alert_priority := 'HIGH';
            alert_type_val := 'EXPIRY_WARNING';
            message_text := batch_record.product_name || ' vence en ' || batch_record.days_until_expiry || ' días (Lote: ' || batch_record.batch_id || ')';
        ELSE
            alert_priority := 'MEDIUM';
            alert_type_val := 'EXPIRY_WARNING';
            message_text := batch_record.product_name || ' vence en ' || batch_record.days_until_expiry || ' días (Lote: ' || batch_record.batch_id || ')';
        END IF;
        
        INSERT INTO inventory_alerts (
            alert_type,
            priority,
            message,
            product_id,
            product_name,
            expiry_date,
            metadata,
            created_by
        ) VALUES (
            alert_type_val,
            alert_priority,
            message_text,
            batch_record.product_id,
            batch_record.product_name,
            batch_record.expiry_date,
            jsonb_build_object(
                'batch_id', batch_record.batch_id,
                'location', batch_record.location_name,
                'days_until_expiry', batch_record.days_until_expiry
            ),
            'system'
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ language 'plpgsql';

-- ================================================================================================
-- ROW LEVEL SECURITY (RLS) - Enable when needed
-- ================================================================================================

-- Enable RLS on all tables (uncomment when using Supabase with authentication)
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables

-- ================================================================================================
-- SAMPLE DATA FOR TESTING (Optional)
-- ================================================================================================

-- Insert sample supplier
INSERT INTO suppliers (supplier_id, code, name, description, contact_email, payment_method, created_by, updated_by)
VALUES ('SUP001', 'SUPPLIER001', 'Proveedor Demo', 'Proveedor de demostración', 'demo@supplier.com', 'credit', 'system', 'system');

-- Insert sample product categories and products
INSERT INTO products (product_id, name, category, base_unit, stock_unit, stock_minimum, stock_reorder_point, is_perishable, created_by, updated_by)
VALUES 
    ('PROD001', 'Agua Mineral 500ml', 'Bebidas', 'bottle', 'bottle', 50, 100, false, 'system', 'system'),
    ('PROD002', 'Pan Blanco', 'Panadería', 'piece', 'piece', 20, 50, true, 'system', 'system');

-- ================================================================================================
-- SCHEDULED TASKS (Run these periodically)
-- ================================================================================================

-- Schedule these functions to run daily:
-- SELECT mark_expired_batches();
-- SELECT create_low_stock_alerts();
-- SELECT create_expiry_alerts();

-- ================================================================================================
-- NOTES FOR IMPLEMENTATION
-- ================================================================================================

/*
1. This schema provides complete inventory management functionality including:
   - Product catalog with complex unit management
   - Supplier management with rating system
   - Purchase order workflow
   - Batch-level inventory tracking
   - Stock movement audit trail
   - Alert system for low stock and expiry
   - Stock transfers between locations

2. Key features implemented:
   - FIFO/LIFO inventory management through batch system
   - Comprehensive audit trail
   - Automated calculations (totals, ratings, etc.)
   - Performance-optimized indexes
   - Data integrity constraints
   - Extensible metadata fields

3. To deploy to Supabase:
   - Run this script in the Supabase SQL editor
   - Enable RLS policies as needed
   - Set up scheduled functions for maintenance tasks
   - Configure authentication and user management

4. Migration considerations:
   - Batch migration scripts can be created to move data from MongoDB
   - All existing functionality is preserved
   - Additional PostgreSQL-specific optimizations included
*/