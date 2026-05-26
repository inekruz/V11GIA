import { useState } from 'react';
import SupplierList from './SupplierList';
import ProductList from './ProductList';
import ProductCalculator from './ProductCalculator';

function MaterialsList({ user, onLogout }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const navigate = useNavigate();

  const handleShowSuppliers = (material, e) => {
    e.stopPropagation();
    setSelectedMaterial(material);
    setShowSuppliers(true);
  };

  const handleShowProducts = (material, e) => {
    e.stopPropagation();
    setSelectedMaterial(material);
    setShowProducts(true);
  };

  const handleShowCalculator = () => {
    setShowCalculator(true);
  };

  return (
    <div className="app">
      <div className="header">
        <div className="header-info">
          <span className="user-name">{user.full_name} ({user.role})</span>
          <button onClick={onLogout} className="logout-btn">Выйти</button>
        </div>
      </div>
      
      <div className="toolbar">
        <div className="toolbar-left">
          <button onClick={() => navigate(-1)} className="back-btn">← Назад</button>
          <button onClick={handleShowCalculator} className="calc-btn"> Расчет продукции</button>
        </div>
        {(user.role === 'manager' || user.role === 'admin') && (
          <button onClick={handleAdd} className="add-btn">+ Добавить материал</button>
        )}
      </div>
      
      <div className="materials-grid">
        {materials.map(m => (
          <div 
            key={m.material_id} 
            className="material-card"
          >
            <div 
              className="card-clickable"
              onClick={() => (user.role === 'manager' || user.role === 'admin') && handleEdit(m)}
            >
              <div className="card-header">
                <span className="material-type">{m.type_name}</span>
                <h3>{m.name}</h3>
              </div>
              <div className="card-details">
                <p>На складе: {m.stock_quantity} {m.measurement_unit}</p>
                <p>Минимум: {m.min_quantity} {m.measurement_unit}</p>
                <p>В упаковке: {m.pack_quantity} {m.measurement_unit}</p>
                <p className="cost">
                  Стоимость партии: {m.min_order_cost !== undefined && m.min_order_cost !== null 
                    ? parseFloat(m.min_order_cost).toFixed(2) 
                    : '0.00'} ₽
                </p>
                  {m.main_supplier_price && (
                    <p className="supplier">
                      Закупочная цена: {parseFloat(m.main_supplier_price).toFixed(2)} ₽
                    </p>
                  )}
              </div>
            </div>
            <div className="card-actions">
              <button 
                onClick={(e) => handleShowSuppliers(m, e)} 
                className="action-btn suppliers-btn"
              >
                 Поставщики
              </button>
              <button 
                onClick={(e) => handleShowProducts(m, e)} 
                className="action-btn products-btn"
              >
                 Продукция
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {showSuppliers && selectedMaterial && (
        <SupplierList 
          material={selectedMaterial} 
          user={user} 
          onBack={() => setShowSuppliers(false)} 
        />
      )}
      
      {showProducts && selectedMaterial && (
        <ProductList 
          material={selectedMaterial} 
          user={user} 
          onBack={() => setShowProducts(false)} 
        />
      )}
      
      {showCalculator && (
        <ProductCalculator 
          user={user} 
          onBack={() => setShowCalculator(false)} 
        />
      )}
    </div>
  );
}

export default MaterialsList;