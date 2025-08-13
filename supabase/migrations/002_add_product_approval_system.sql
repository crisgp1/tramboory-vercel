-- Migration: Add Product Approval System
-- This adds approval workflow fields to the products table

-- First, let's add the approval_status field to products table
ALTER TABLE public.products 
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add rejection_reason field for when products are rejected
ALTER TABLE public.products 
ADD COLUMN rejection_reason TEXT;

-- Add approved_by and approved_at fields for audit trail
ALTER TABLE public.products 
ADD COLUMN approved_by TEXT,
ADD COLUMN approved_at TIMESTAMPTZ;

-- Add rejected_by and rejected_at fields for audit trail
ALTER TABLE public.products 
ADD COLUMN rejected_by TEXT,
ADD COLUMN rejected_at TIMESTAMPTZ;

-- Update existing products to have 'approved' status if they are active
UPDATE public.products 
SET approval_status = 'approved' 
WHERE is_active = true;

-- Update existing products to have 'pending' status if they are inactive
UPDATE public.products 
SET approval_status = 'pending' 
WHERE is_active = false;

-- Create an index for faster filtering by approval_status
CREATE INDEX idx_products_approval_status ON public.products(approval_status);

-- Create a function to automatically set approved_at when status changes to approved
CREATE OR REPLACE FUNCTION update_product_approval_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
        NEW.approved_at = NOW();
    END IF;
    
    IF NEW.approval_status = 'rejected' AND OLD.approval_status != 'rejected' THEN
        NEW.rejected_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
CREATE TRIGGER trigger_product_approval_timestamp
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_approval_timestamp();

-- Add RLS policies for the new fields if RLS is enabled
-- (This assumes you have RLS policies already set up for products)

-- Comment explaining the approval workflow:
COMMENT ON COLUMN public.products.approval_status IS 'Product approval status: pending (awaiting approval), approved (active and visible), rejected (not approved)';
COMMENT ON COLUMN public.products.rejection_reason IS 'Reason for rejection when approval_status is rejected';
COMMENT ON COLUMN public.products.approved_by IS 'User ID who approved the product';
COMMENT ON COLUMN public.products.approved_at IS 'Timestamp when product was approved';
COMMENT ON COLUMN public.products.rejected_by IS 'User ID who rejected the product';
COMMENT ON COLUMN public.products.rejected_at IS 'Timestamp when product was rejected';