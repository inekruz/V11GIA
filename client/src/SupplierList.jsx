import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Компонент списка поставщиков
function SupplierList({ material, user, onBack }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, [material.material_id]);

  const loadSuppliers = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/materials/${material.material_id}/suppliers`, {
        headers: { 'x-user-role-id': user?.role_id || 1 }
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (rating) => {
    if (!rating) return 'Нет рейтинга';
    return '★'.repeat(rating) + '☆'.repeat(10 - rating);
  };

  // Функция для безопасного форматирования цены
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0.00';
    const num = parseFloat(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  if (loading) return <div className="loading">Загрузка поставщиков...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Поставщики материала: {material.name}</h2>
          <button onClick={onBack} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          {suppliers.length === 0 ? (
            <p className="no-data">Нет данных о поставщиках для этого материала</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Наименование поставщика</th>
                  <th>Рейтинг</th>
                  <th>Закупочная цена (₽)</th>
                  <th>Средний срок поставки (дней)</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.supplier_id}>
                    <td>{s.name}</td>
                    <td className="rating">{getRatingStars(s.rating)}</td>
                    <td>{formatPrice(s.purchase_price)}</td>
                    <td>{s.avg_delivery_days}</td>
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

export default SupplierList;