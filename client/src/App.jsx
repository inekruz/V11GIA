import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './App.css';

// Компонент авторизации
function Login({ onLogin }) {
  const [login, setLogin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error);
      }
      
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Вход в систему</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Компонент списка поставщиков
function SupplierList({ material, user, onBack }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, [material]);

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
    const numRating = parseInt(rating);
    if (isNaN(numRating)) return 'Нет рейтинга';
    return '★'.repeat(numRating) + '☆'.repeat(10 - numRating);
  };

  // Безопасное форматирование цены
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0.00';
    const num = parseFloat(price);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  if (loading) return <div className="loading">Загрузка поставщиков...</div>;
  if (error) return <div className="error-message">{error}</div>;

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
                    <td>{s.avg_delivery_days || 0}</td>
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

// Компонент списка продукции
function ProductList({ material, user, onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, [material]);

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

  const formatQuantity = (qty) => {
    if (qty === undefined || qty === null) return '0.000';
    const num = parseFloat(qty);
    if (isNaN(num)) return '0.000';
    return num.toFixed(3);
  };

  if (loading) return <div className="loading">Загрузка продукции...</div>;
  if (error) return <div className="error-message">{error}</div>;

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

// Компонент списка материалов
function MaterialsList({ user, onLogout }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/materials', {
        headers: { 'x-user-role-id': user?.role_id || 1 }
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setMaterials(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material) => {
    navigate(`/edit/${material.material_id}`);
  };

  const handleAdd = () => {
    navigate('/add');
  };

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

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0.00';
    const num = parseFloat(price);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  const canEdit = user?.role_id === 2 || user?.role_id === 3;

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="app">
      <div className="header">
        <h1>AUTO PARK</h1>
        <div className="header-info">
          <span className="user-name">{user?.full_name} ({user?.role_name})</span>
          <button onClick={onLogout} className="logout-btn">Выйти</button>
        </div>
      </div>
      
      <div className="toolbar">
        <div className="toolbar-left">
          <button onClick={() => navigate(-1)} className="back-btn">← Назад</button>
        </div>
        {canEdit && (
          <button onClick={handleAdd} className="add-btn">+ Добавить материал</button>
        )}
      </div>
      
      <div className="materials-grid">
        {materials.map(m => (
          <div key={m.material_id} className="material-card">
            <div 
              className="card-clickable"
              onClick={() => canEdit && handleEdit(m)}
              style={{ cursor: canEdit ? 'pointer' : 'default' }}
            >
              <div className="card-header">
                <span className="material-type">{m.type_name}</span>
                <h3>{m.name}</h3>
              </div>
              <div className="card-details">
                <p>На складе: {m.stock_quantity} {m.measurement_unit}</p>
                <p>Минимум: {m.min_quantity} {m.measurement_unit}</p>
                <p>В упаковке: {m.pack_quantity} {m.measurement_unit}</p>
                <p className="cost">Стоимость партии: {formatPrice(m.min_order_cost)} ₽</p>
                {m.main_supplier_price && (
                  <p className="supplier">Закупочная цена: {formatPrice(m.main_supplier_price)} ₽</p>
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
    </div>
  );
}

// Форма добавления/редактирования
function MaterialForm({ user, onSuccess, onCancel }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [materialTypes, setMaterialTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    material_type_id: '',
    measurement_unit: '',
    pack_quantity: '',
    stock_quantity: '',
    min_quantity: '',
    unit_price: ''
  });
  
  const [supplierData, setSupplierData] = useState({
    supplier_id: '',
    purchase_price: '',
    avg_delivery_days: ''
  });

  const isEdit = !!id;

  useEffect(() => {
    fetch('http://localhost:5000/api/material-types')
      .then(res => res.json())
      .then(setMaterialTypes);
    
    fetch('http://localhost:5000/api/suppliers')
      .then(res => res.json())
      .then(setSuppliers);
    
    if (isEdit) {
      fetch('http://localhost:5000/api/materials', {
        headers: { 'x-user-role-id': user?.role_id || 1 }
      })
        .then(res => res.json())
        .then(materials => {
          const material = materials.find(m => m.material_id === parseInt(id));
          if (material) {
            setFormData({
              name: material.name,
              material_type_id: material.material_type_id,
              measurement_unit: material.measurement_unit,
              pack_quantity: material.pack_quantity,
              stock_quantity: material.stock_quantity,
              min_quantity: material.min_quantity,
              unit_price: material.unit_price
            });
          }
        });
    }
  }, [id, isEdit]);

  const validateForm = () => {
    if (parseFloat(formData.unit_price) < 0) {
      setError('Цена не может быть отрицательной');
      return false;
    }
    if (parseFloat(formData.min_quantity) < 0) {
      setError('Минимальное количество не может быть отрицательным');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Наименование обязательно');
      return false;
    }
    if (!formData.material_type_id) {
      setError('Выберите тип материала');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    const url = isEdit 
      ? `http://localhost:5000/api/materials/${id}`
      : 'http://localhost:5000/api/materials';
    
    const method = isEdit ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-role-id': user?.role_id || 1
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error);
      }
      
      if (supplierData.supplier_id && supplierData.purchase_price) {
        await fetch('http://localhost:5000/api/material-suppliers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role-id': user?.role_id || 1
          },
          body: JSON.stringify({
            material_id: isEdit ? parseInt(id) : data.material_id,
            supplier_id: parseInt(supplierData.supplier_id),
            purchase_price: parseFloat(supplierData.purchase_price),
            avg_delivery_days: parseInt(supplierData.avg_delivery_days) || 7
          })
        });
      }
      
      setSuccess(isEdit ? 'Материал обновлен!' : 'Материал добавлен!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>{isEdit ? 'Редактирование материала' : 'Добавление материала'}</h1>
      </div>
      
      <div className="toolbar">
        <button onClick={onCancel} className="back-btn">← Назад</button>
      </div>
      
      <form onSubmit={handleSubmit} className="material-form">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="form-group">
          <label>Наименование *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Тип материала *</label>
          <select
            value={formData.material_type_id}
            onChange={(e) => setFormData({...formData, material_type_id: e.target.value})}
            required
          >
            <option value="">Выберите тип</option>
            {materialTypes.map(t => (
              <option key={t.material_type_id} value={t.material_type_id}>
                {t.type_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Единица измерения</label>
          <input
            type="text"
            value={formData.measurement_unit}
            onChange={(e) => setFormData({...formData, measurement_unit: e.target.value})}
            placeholder="кг, л, шт и т.д."
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Количество в упаковке</label>
            <input
              type="number"
              step="any"
              value={formData.pack_quantity}
              onChange={(e) => setFormData({...formData, pack_quantity: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Количество на складе</label>
            <input
              type="number"
              step="any"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Минимальное количество *</label>
            <input
              type="number"
              step="any"
              value={formData.min_quantity}
              onChange={(e) => setFormData({...formData, min_quantity: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Цена за единицу *</label>
            <input
              type="number"
              step="0.01"
              value={formData.unit_price}
              onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
              required
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>Основной поставщик (опционально)</h3>
          
          <div className="form-group">
            <label>Поставщик</label>
            <select
              value={supplierData.supplier_id}
              onChange={(e) => setSupplierData({...supplierData, supplier_id: e.target.value})}
            >
              <option value="">Выберите поставщика</option>
              {suppliers.map(s => (
                <option key={s.supplier_id} value={s.supplier_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Закупочная цена</label>
              <input
                type="number"
                step="0.01"
                value={supplierData.purchase_price}
                onChange={(e) => setSupplierData({...supplierData, purchase_price: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Средний срок поставки (дней)</label>
              <input
                type="number"
                value={supplierData.avg_delivery_days}
                onChange={(e) => setSupplierData({...supplierData, avg_delivery_days: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Отмена
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Добавить')}
          </button>
        </div>
      </form>
    </div>
  );
}

// Главный компонент
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Ошибка парсинга user из localStorage', e);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MaterialsList user={user} onLogout={handleLogout} />} />
        <Route path="/add" element={
          <MaterialForm 
            user={user} 
            onSuccess={() => {}} 
            onCancel={() => window.history.back()} 
          />
        } />
        <Route path="/edit/:id" element={
          <MaterialForm 
            user={user} 
            onSuccess={() => {}} 
            onCancel={() => window.history.back()} 
          />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;