const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '11111111',
  port: 5432,
});

// получить основного поставщика (по минимальной цене)
async function getMainSupplier(materialId) {
  const res = await pool.query(
    `SELECT supplier_id, purchase_price 
     FROM material_suppliers 
     WHERE material_id = $1 
     ORDER BY purchase_price ASC 
     LIMIT 1`,
    [materialId]
  );
  return res.rows[0] || null;
}

// расчет стоимости минимальной партии
async function calculateMinOrderCost(materialId, stockQty, minQty, packQty) {
  if (stockQty >= minQty) return 0;
  
  const need = minQty - stockQty;
  const orderQty = Math.ceil(need / packQty) * packQty;
  
  const supplier = await getMainSupplier(materialId);
  if (!supplier) return 0;
  
  return orderQty * parseFloat(supplier.purchase_price);
}

//расчет требуемого количества по производственному плану
async function calculateRequiredQty(materialId) {
  const res = await pool.query(
    `SELECT SUM(mp.quantity_per_product * pp.planned_quantity) AS total_required
     FROM material_products mp
     JOIN production_plan pp ON mp.product_sku = pp.product_sku
     WHERE mp.material_id = $1`,
    [materialId]
  );
  return parseFloat(res.rows[0].total_required) || 0;
}

// список материалов с доп. полями
app.get('/api/materials', async (req, res) => {
  try {
    const materialsRes = await pool.query(`
      SELECT m.*, mt.type_name, mt.loss_percent
      FROM materials m
      JOIN material_type mt ON m.material_type_id = mt.material_type_id
    `);
    
    const materials = await Promise.all(materialsRes.rows.map(async (m) => {
      const minOrderCost = await calculateMinOrderCost(
        m.material_id,
        parseFloat(m.stock_quantity),
        parseFloat(m.min_quantity),
        parseFloat(m.pack_quantity)
      );
      
      const requiredQty = await calculateRequiredQty(m.material_id);
      
      const supplier = await getMainSupplier(m.material_id);
      
      return {
        ...m,
        stock_quantity: parseFloat(m.stock_quantity),
        min_quantity: parseFloat(m.min_quantity),
        pack_quantity: parseFloat(m.pack_quantity),
        unit_price: parseFloat(m.unit_price),
        min_order_cost: minOrderCost,
        required_quantity: requiredQty,
        main_supplier_name: supplier ? supplier.supplier_id : null,
        main_supplier_price: supplier ? parseFloat(supplier.purchase_price) : null,
      };
    }));
    
    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// только менеджер и админ
app.post('/api/materials', requireRole(['manager', 'admin']), async (req, res) => {
  const { name, material_type_id, measurement_unit, pack_quantity, stock_quantity, min_quantity, unit_price } = req.body;
  
  // Валидация
  if (unit_price < 0) {
    return res.status(400).json({ error: 'Цена не может быть отрицательной' });
  }
  if (min_quantity < 0) {
    return res.status(400).json({ error: 'Минимальное количество не может быть отрицательным' });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO materials (name, material_type_id, measurement_unit, pack_quantity, stock_quantity, min_quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, material_type_id, measurement_unit, pack_quantity, stock_quantity, min_quantity, unit_price]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Материал с таким названием уже существует' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
});

// только менеджер и админ
app.put('/api/materials/:id', requireRole(['manager', 'admin']), async (req, res) => {
  const { id } = req.params;
  const { name, material_type_id, measurement_unit, pack_quantity, stock_quantity, min_quantity, unit_price } = req.body;
  
  if (unit_price < 0) {
    return res.status(400).json({ error: 'Цена не может быть отрицательной' });
  }
  if (min_quantity < 0) {
    return res.status(400).json({ error: 'Минимальное количество не может быть отрицательным' });
  }
  
  try {
    const result = await pool.query(
      `UPDATE materials 
       SET name = $1, material_type_id = $2, measurement_unit = $3, 
           pack_quantity = $4, stock_quantity = $5, min_quantity = $6, unit_price = $7
       WHERE material_id = $8
       RETURNING *`,
      [name, material_type_id, measurement_unit, pack_quantity, stock_quantity, min_quantity, unit_price, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Материал не найден' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Материал с таким названием уже существует' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
});

// для выпадающего списка
app.get('/api/material-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT material_type_id, type_name FROM material_type ORDER BY type_name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// для выпадающего списка поставщиков
app.get('/api/suppliers', async (req, res) => {
  try {
    const result = await pool.query('SELECT supplier_id, name FROM suppliers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// установка основного поставщика
app.post('/api/material-suppliers', requireRole(['manager', 'admin']), async (req, res) => {
  const { material_id, supplier_id, purchase_price, avg_delivery_days } = req.body;
  
  try {
    await pool.query(
      `INSERT INTO material_suppliers (material_id, supplier_id, purchase_price, avg_delivery_days)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (material_id, supplier_id) 
       DO UPDATE SET purchase_price = $3, avg_delivery_days = $4`,
      [material_id, supplier_id, purchase_price, avg_delivery_days]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// авторизация
app.post('/api/login', async (req, res) => {
  const { login } = req.body;
  
  try {
    const userRes = await pool.query(
      `SELECT u.user_id, u.login, u.full_name, u.status, 
              r.role_id, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.login = $1 AND u.status = 'active'`,
      [login]
    );
    
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пользователь заблокирован' });
    }
    
    const user = userRes.rows[0];
    res.json({
      user_id: user.user_id,
      login: user.login,
      full_name: user.full_name,
      role_id: user.role_id,
      role_name: user.role_name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Middleware для проверки роли по числовому ID
function requireRole(allowedRoleIds) {
  return (req, res, next) => {
    const userRoleId = parseInt(req.headers['x-user-role-id']);
    if (!userRoleId || !allowedRoleIds.includes(userRoleId)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
}

app.listen(5000, () => {
  console.log('Server run 5000');
});