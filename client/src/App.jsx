import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/materials')
      .then(res => res.json())
      .then(data => {
        setMaterials(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="app">
      <div className="header">
        <h1>Материалы</h1>
      </div>
      
      <div className="materials-grid">
        {materials.map(m => (
          <div key={m.material_id} className="material-card">
            <div className="card-header">
              <span className="material-type">{m.type_name}</span>
              <h3>{m.name}</h3>
            </div>
            <div className="card-details">
              <p>На складе: {m.stock_quantity} {m.measurement_unit}</p>
              <p>Минимум: {m.min_quantity} {m.measurement_unit}</p>
              <p className="cost">Стоимость партии: {m.min_order_cost.toFixed(2)} ₽</p>
              {m.main_supplier_price && (
                <p className="supplier">
                  Поставщик: цена {m.main_supplier_price} ₽
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;