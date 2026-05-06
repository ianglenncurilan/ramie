-- Create categories table for dynamic ingredient categorization
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for ingredient-category relationships
CREATE TABLE IF NOT EXISTS ingredient_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ingredient_id, category_id)
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES 
('Carbohydrates', 'Energy-rich ingredients like corn, rice bran, and molasses'),
('Proteins', 'Protein sources like fish meal, soybean meal, and azolla'),
('Minerals', 'Essential minerals and supplements'),
('Vitamins', 'Vitamin supplements and additives'),
('Fibers', 'Fiber-rich ingredients like rice hull and banana leaves'),
('Liquids', 'Water and liquid ingredients'),
('Other', 'Miscellaneous ingredients');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_ingredient_categories_ingredient ON ingredient_categories(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_categories_category ON ingredient_categories(category_id);
