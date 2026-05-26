CREATE TABLE material_type (
    material_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    loss_percent DECIMAL(5,2) NOT NULL
);

CREATE TABLE materials (
    material_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    material_type_id INT NOT NULL REFERENCES material_type(material_type_id),
    unit_price DECIMAL(10,2) NOT NULL,
    stock_quantity DECIMAL(12,3) NOT NULL,
    min_quantity DECIMAL(12,3) NOT NULL,
    pack_quantity DECIMAL(12,3) NOT NULL,
    measurement_unit VARCHAR(20) NOT NULL
);

CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    tin VARCHAR(20) NOT NULL UNIQUE,
    rating INT CHECK (rating BETWEEN 1 AND 10),
    start_date DATE NOT NULL
);

CREATE TABLE material_suppliers (
    material_id INT REFERENCES materials(material_id),
    supplier_id INT REFERENCES suppliers(supplier_id),
    purchase_price DECIMAL(10,2) NOT NULL,
    avg_delivery_days INT NOT NULL,
    PRIMARY KEY (material_id, supplier_id)
);

CREATE TABLE product_type (
    product_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    coefficient DECIMAL(5,2) NOT NULL
);

CREATE TABLE products (
    sku VARCHAR(50) PRIMARY KEY,
    product_type_id INT NOT NULL REFERENCES product_type(product_type_id),
    name VARCHAR(200) NOT NULL UNIQUE,
    min_partner_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE material_products (
    material_id INT REFERENCES materials(material_id),
    product_sku VARCHAR(50) REFERENCES products(sku),
    quantity_per_product DECIMAL(12,5) NOT NULL,
    PRIMARY KEY (material_id, product_sku)
);

CREATE TABLE production_plan (
    period_date DATE NOT NULL,
    product_sku VARCHAR(50) REFERENCES products(sku),
    planned_quantity INT NOT NULL,
    PRIMARY KEY (period_date, product_sku)
);

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    permission_description TEXT
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(role_id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'blocked'))
);