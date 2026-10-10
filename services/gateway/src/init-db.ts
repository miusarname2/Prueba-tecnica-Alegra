import { getPool } from './database';

export async function ensureDatabaseSchema(): Promise<void> {
  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'ingredients'
       );`
    );

    if (rows[0]?.exists) {
      console.log('[database] Schema already exists. Skipping initialization.');
      return;
    }

    console.log('[database] Fresh database detected. Creating schema and inserting seed data...');

    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS ingredients (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(50) NOT NULL,
          name_en VARCHAR(50) NOT NULL,
          stock INT NOT NULL DEFAULT 5,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS recipes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          image_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS recipe_ingredients (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
          ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
          quantity INT NOT NULL DEFAULT 1,
          UNIQUE(recipe_id, ingredient_id)
      );

      CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          total_plates INT NOT NULL,
          completed_plates INT NOT NULL DEFAULT 0,
          status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS plates (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          recipe_id UUID REFERENCES recipes(id),
          recipe_name VARCHAR(100),
          status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchase_history (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          ingredient_id UUID REFERENCES ingredients(id),
          ingredient_name VARCHAR(50) NOT NULL,
          quantity_requested INT NOT NULL DEFAULT 1,
          quantity_bought INT NOT NULL DEFAULT 0,
          success BOOLEAN NOT NULL DEFAULT false,
          purchased_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_plates_order_id ON plates(order_id);
      CREATE INDEX IF NOT EXISTS idx_plates_status ON plates(status);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_purchase_history_ingredient ON purchase_history(ingredient_id);
      CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
    `);

    await pool.query(`
      INSERT INTO ingredients (id, name, name_en, stock) VALUES
          (uuid_generate_v4(), 'Tomate',  'tomato',  5),
          (uuid_generate_v4(), 'Limón',   'lemon',   5),
          (uuid_generate_v4(), 'Patatas', 'potato',  5),
          (uuid_generate_v4(), 'Arroz',   'rice',    5),
          (uuid_generate_v4(), 'Ketchup', 'ketchup', 5),
          (uuid_generate_v4(), 'Lechuga', 'lettuce', 5),
          (uuid_generate_v4(), 'Cebolla', 'onion',   5),
          (uuid_generate_v4(), 'Queso',   'cheese',  5),
          (uuid_generate_v4(), 'Carne',   'meat',    5),
          (uuid_generate_v4(), 'Pollo',   'chicken', 5);
    `);

    await pool.query(`
      DO $$
      DECLARE
          r1 UUID := uuid_generate_v4();
          r2 UUID := uuid_generate_v4();
          r3 UUID := uuid_generate_v4();
          r4 UUID := uuid_generate_v4();
          r5 UUID := uuid_generate_v4();
          r6 UUID := uuid_generate_v4();

          ing_tomato  UUID;
          ing_lemon   UUID;
          ing_potato  UUID;
          ing_rice    UUID;
          ing_ketchup UUID;
          ing_lettuce UUID;
          ing_onion   UUID;
          ing_cheese  UUID;
          ing_meat    UUID;
          ing_chicken UUID;
      BEGIN
          SELECT id INTO ing_tomato  FROM ingredients WHERE name_en = 'tomato';
          SELECT id INTO ing_lemon   FROM ingredients WHERE name_en = 'lemon';
          SELECT id INTO ing_potato  FROM ingredients WHERE name_en = 'potato';
          SELECT id INTO ing_rice    FROM ingredients WHERE name_en = 'rice';
          SELECT id INTO ing_ketchup FROM ingredients WHERE name_en = 'ketchup';
          SELECT id INTO ing_lettuce FROM ingredients WHERE name_en = 'lettuce';
          SELECT id INTO ing_onion   FROM ingredients WHERE name_en = 'onion';
          SELECT id INTO ing_cheese  FROM ingredients WHERE name_en = 'cheese';
          SELECT id INTO ing_meat    FROM ingredients WHERE name_en = 'meat';
          SELECT id INTO ing_chicken FROM ingredients WHERE name_en = 'chicken';

          INSERT INTO recipes (id, name, description, image_url) VALUES
              (r1, 'Hamburguesa Clásica', 'Jugosa hamburguesa con carne, lechuga, tomate, queso, cebolla y ketchup', '/images/hamburguesa.png');
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES
              (r1, ing_meat, 1),
              (r1, ing_lettuce, 1),
              (r1, ing_tomato, 1),
              (r1, ing_cheese, 1),
              (r1, ing_onion, 1),
              (r1, ing_ketchup, 1);

          INSERT INTO recipes (id, name, description, image_url) VALUES
              (r2, 'Pollo a la Plancha', 'Pechuga de pollo a la plancha con arroz y un toque de limón', '/images/pollo.png');
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES
              (r2, ing_chicken, 1),
              (r2, ing_rice, 2),
              (r2, ing_lemon, 1);

          INSERT INTO recipes (id, name, description, image_url) VALUES
              (r3, 'Ensalada Fresca', 'Ensalada ligera con lechuga, tomate, cebolla y aderezo de limón', '/images/ensalada.png');
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES
              (r3, ing_lettuce, 2),
              (r3, ing_tomato, 1),
              (r3, ing_onion, 1),
              (r3, ing_lemon, 1);

          INSERT INTO recipes (id, name, description, image_url) VALUES
              (r4, 'Patatas con Queso', 'Patatas doradas con queso fundido y ketchup', '/images/patatas.png');
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES
              (r4, ing_potato, 2),
              (r4, ing_cheese, 1),
              (r4, ing_ketchup, 1);

          INSERT INTO recipes (id, name, description, image_url) VALUES
              (r5, 'Tacos de Carne', 'Tacos con carne sazonada, tomate, cebolla, lechuga y queso', '/images/tacos.png');
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES
              (r5, ing_meat, 1),
              (r5, ing_tomato, 1),
              (r5, ing_onion, 1),
              (r5, ing_lettuce, 1),
              (r5, ing_cheese, 1);

          INSERT INTO recipes (id, name, description, image_url) VALUES
              (r6, 'Arroz con Pollo', 'Arroz con pollo, tomate y cebolla, un clásico reconfortante', '/images/arroz-pollo.png');
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES
              (r6, ing_rice, 2),
              (r6, ing_chicken, 1),
              (r6, ing_tomato, 1),
              (r6, ing_onion, 1);
      END $$;
    `);

    console.log('[database] Database initialization completed successfully.');
  } catch (err) {
    console.error('[database] Error during automatic schema initialization:', err);
  }
}
