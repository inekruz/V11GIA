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

app.listen(5000, () => {
  console.log('Server run 5000');
});