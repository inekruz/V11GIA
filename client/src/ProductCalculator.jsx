import { useEffect, useState } from 'react';

function ProductCalculator({ user, onBack }) {
  const [productTypes, setProductTypes] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [formData, setFormData] = useState({
    product_type_id: '',
    material_type_id: '',
    material_quantity: '',
    param1: '',
    param2: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Загрузка типов продукции
    fetch('http://localhost:5000/api/product-types')
      .then(res => res.json())
      .then(setProductTypes);
    
    // Загрузка типов материалов
    fetch('http://localhost:5000/api/material-types')
      .then(res => res.json())
      .then(setMaterialTypes);
  }, []);

  const handleCalculate = async () => {
    if (!formData.product_type_id || !formData.material_type_id || !formData.material_quantity || !formData.param1 || !formData.param2) {
      setError('Заполните все поля');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const res = await fetch('http://localhost:5000/api/calculate-product-quantity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role
        },
        body: JSON.stringify({
          product_type_id: parseInt(formData.product_type_id),
          material_type_id: parseInt(formData.material_type_id),
          material_quantity: parseFloat(formData.material_quantity),
          param1: parseFloat(formData.param1),
          param2: parseFloat(formData.param2)
        })
      });
      
      const data = await res.json();
      
      if (data === -1) {
        setError('Указаны несуществующие типы продукции или материалов');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Ошибка при расчете');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal-content calculator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Расчет количества продукции из сырья</h2>
          <button onClick={onBack} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Тип продукции</label>
            <select
              value={formData.product_type_id}
              onChange={(e) => setFormData({...formData, product_type_id: e.target.value})}
            >
              <option value="">Выберите тип продукции</option>
              {productTypes.map(t => (
                <option key={t.product_type_id} value={t.product_type_id}>
                  {t.type_name} (коэф. {t.coefficient})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Тип материала</label>
            <select
              value={formData.material_type_id}
              onChange={(e) => setFormData({...formData, material_type_id: e.target.value})}
            >
              <option value="">Выберите тип материала</option>
              {materialTypes.map(t => (
                <option key={t.material_type_id} value={t.material_type_id}>
                  {t.type_name} (потери {t.loss_percent}%)
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Количество сырья</label>
            <input
              type="number"
              step="any"
              value={formData.material_quantity}
              onChange={(e) => setFormData({...formData, material_quantity: e.target.value})}
              placeholder="Введите количество сырья"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Параметр продукции 1</label>
              <input
                type="number"
                step="0.01"
                value={formData.param1}
                onChange={(e) => setFormData({...formData, param1: e.target.value})}
                placeholder="Положительное число"
              />
            </div>
            
            <div className="form-group">
              <label>Параметр продукции 2</label>
              <input
                type="number"
                step="0.01"
                value={formData.param2}
                onChange={(e) => setFormData({...formData, param2: e.target.value})}
                placeholder="Положительное число"
              />
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button onClick={handleCalculate} disabled={loading} className="calculate-btn">
            {loading ? 'Расчет...' : 'Рассчитать'}
          </button>
          
          {result !== null && (
            <div className="result-box">
              <h3>Результат расчета</h3>
              <p className="result-value">
                Из указанного количества сырья можно получить <strong>{result}</strong> единиц продукции
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCalculator;