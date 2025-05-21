-- PostgreSQL initialization script for 3D Print Quoting System
-- This file will be executed during the first start of the PostgreSQL container

-- Create database tables if they don't exist

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    material_type VARCHAR(50) NOT NULL,
    infill_percentage INTEGER NOT NULL,
    layer_height DECIMAL(4,2) NOT NULL,
    estimated_print_time INTEGER NOT NULL, -- minutes
    material_cost DECIMAL(8,2) NOT NULL,
    labor_cost DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(8,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES quotes(id),
    user_email VARCHAR(255) NOT NULL,
    paypal_order_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(8,2) NOT NULL,
    payment_captured_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    price_per_gram DECIMAL(8,4) NOT NULL,
    density DECIMAL(8,4) NOT NULL, -- g/cm³
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default materials if not exist
INSERT INTO materials (name, code, price_per_gram, density, description)
VALUES 
    ('PLA', 'PLA', 0.025, 1.24, 'Standard PLA filament')
ON CONFLICT (code) DO NOTHING;

INSERT INTO materials (name, code, price_per_gram, density, description)
VALUES 
    ('ABS', 'ABS', 0.028, 1.04, 'ABS filament')
ON CONFLICT (code) DO NOTHING;

INSERT INTO materials (name, code, price_per_gram, density, description)
VALUES 
    ('PETG', 'PETG', 0.035, 1.27, 'PETG filament')
ON CONFLICT (code) DO NOTHING;

INSERT INTO materials (name, code, price_per_gram, density, description)
VALUES 
    ('TPU', 'TPU', 0.045, 1.21, 'Flexible TPU filament')
ON CONFLICT (code) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON orders(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(code);
