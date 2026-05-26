import { useEffect, useState } from 'react';

// Компонент списка продукции
function ProductList({ material, user, onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, [material.material_id]);

  const loadProducts = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/materials/${material.material_id}/products`, {
        headers: { 'x-user-role-id': user?.role_id || 1 }
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // функция для безопасного форматирования количества
  const formatQuantity = (qty) => {
    if (qty === undefined || qty === null) return '0.000';
    const num = parseFloat(qty);
    return isNaN(num) ? '0.000' : num.toFixed(3);
  };

  if (loading) return <div className="loading">Загрузка продукции...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Продукция с использованием материала: {material.name}</h2>
          <button onClick={onBack} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          {products.length === 0 ? (
            <p className="no-data">Нет данных о продукции для этого материала</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Артикул</th>
                  <th>Наименование продукции</th>
                  <th>Количество материала на единицу</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.sku}>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{formatQuantity(p.quantity_per_product)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductList;