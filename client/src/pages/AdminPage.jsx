import { useEffect, useState } from 'react';
import { authFetch } from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';

const API = import.meta.env.VITE_API_URL;

const STATUS_LABELS = {
  NEW: 'Новый',
  PROCESSING: 'В обработке',
  SHIPPED: 'Отправлен',
  DELIVERED: 'Доставлен',
  DONE: 'Завершён',
  CANCELLED: 'Отменён',
};

const ORDER_STATUSES = [
  { key: 'NEW',        label: 'Новый' },
  { key: 'PROCESSING', label: 'В обработке' },
  { key: 'SHIPPED',    label: 'Отправлен' },
  { key: 'DELIVERED',  label: 'Доставлен' },
  { key: 'DONE',       label: 'Завершён' },
  { key: 'CANCELLED',  label: 'Отменён' },
];

const notify = (setter, text, type = 'ok') => {
  setter({ text, type });
  setTimeout(() => setter({ text: '', type: '' }), 4000);
};

function AdminPage() {
  const emptyProductForm = { name: '', description: '', price: '', stock: '', categoryId: '' };
  const emptyCategoryForm = { name: '' };

  const [activeTab, setActiveTab] = useState('stats');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');

  const [productMessage, setProductMessage] = useState({ text: '', type: '' });
  const [categoryMessage, setCategoryMessage] = useState('');
  const [orderMessage, setOrderMessage] = useState('');

  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Banner tab
  const [heroPreview, setHeroPreview] = useState(null);
  const [heroLoading, setHeroLoading] = useState(false);
  const [naadymForm, setNaadymForm] = useState({
    naadymTitle: 'НААДЫМ 2026',
    naadymSubtitle: 'Праздник трёх игр',
    naadymText: '',
    naadymPromoCode: '',
    naadymPromoText: '',
    naadymVisible: true,
  });

  // Promos tab
  const [promos, setPromos] = useState([]);
  const [promoForm, setPromoForm] = useState({ code: '', discount: '', usageLimit: '', expiresAt: '', isActive: true });
  const [promoMessage, setPromoMessage] = useState({ text: '', type: '' });

  const [confirm, setConfirm] = useState(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const loadPromos = async () => {
    const res = await fetch(`${API}/api/promos`, { headers: authHeaders });
    if (res.ok) setPromos(await res.json());
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API}/api/categories`);
      setCategories(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products?limit=1000`);
      const data = await res.json();
      setProducts(data.products || data);
    } catch (e) { console.error(e); }
  };

  const loadOrders = async (search = '') => {
    const url = search ? `${API}/api/orders?search=${encodeURIComponent(search)}` : `${API}/api/orders`;
    const res = await authFetch(url);
    if (!res) return;
    const data = await res.json();
    if (res.ok) setOrders(data);
    else setOrderMessage(data.message || 'Не удалось загрузить заказы.');
  };

  const loadStats = async () => {
    setStatsLoading(true);
    const res = await authFetch(`${API}/api/orders/stats`);
    setStatsLoading(false);
    if (!res) return;
    const data = await res.json();
    if (res.ok) setStats(data);
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadOrders();
    loadStats();
    // Load current hero
    fetch(`${API}/api/settings/hero`)
      .then(r => r.json())
      .then(data => { if (data.imageUrl) setHeroPreview(`${API}${data.imageUrl}`); })
      .catch(() => {});
  }, []);

  // Search orders debounce
  useEffect(() => {
    const t = setTimeout(() => loadOrders(orderSearch), 400);
    return () => clearTimeout(t);
  }, [orderSearch]);

  // Load promos / banner settings when tab opens
  useEffect(() => {
    if (activeTab === 'promos') loadPromos();
    if (activeTab === 'banner') {
      fetch(`${API}/api/settings/hero`)
        .then(r => r.json())
        .then(data => {
          if (data.imageUrl) setHeroPreview(`${API}${data.imageUrl}`);
          setNaadymForm({
            naadymTitle: data.naadymTitle || 'НААДЫМ 2026',
            naadymSubtitle: data.naadymSubtitle || 'Праздник трёх игр',
            naadymText: data.naadymText || '',
            naadymPromoCode: data.naadymPromoCode || '',
            naadymPromoText: data.naadymPromoText || '',
            naadymVisible: data.naadymVisible !== false,
          });
          loadPromos(); // нужны промокоды для select-а
        })
        .catch(() => {});
    }
  }, [activeTab]);

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setImageFile(null);
    setImagePreview('');
  };
  const resetCategoryForm = () => { setCategoryForm(emptyCategoryForm); setEditingCategoryId(null); };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductMessage({ text: '', type: '' });
    if (!productForm.name || !productForm.description || !productForm.price || !productForm.categoryId) {
      notify(setProductMessage, 'Заполните все обязательные поля товара.', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('description', productForm.description);
    formData.append('price', productForm.price);
    formData.append('stock', productForm.stock || 0);
    formData.append('categoryId', productForm.categoryId);
    if (imageFile) formData.append('image', imageFile);

    const url = editingProductId ? `${API}/api/products/${editingProductId}` : `${API}/api/products`;
    const method = editingProductId ? 'PUT' : 'POST';
    const res = await authFetch(url, { method, body: formData });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { notify(setProductMessage, data.message || 'Операция не выполнена.', 'error'); return; }
    notify(setProductMessage, editingProductId ? 'Товар успешно обновлён.' : 'Товар успешно добавлен.');
    resetProductForm();
    loadProducts();
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryMessage('');
    if (!categoryForm.name) { setCategoryMessage('Введите название категории.'); return; }
    const url = editingCategoryId ? `${API}/api/categories/${editingCategoryId}` : `${API}/api/categories`;
    const method = editingCategoryId ? 'PUT' : 'POST';
    const res = await authFetch(url, { method, body: JSON.stringify({ name: categoryForm.name }) });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { setCategoryMessage(data.message || 'Операция не выполнена.'); return; }
    setCategoryMessage(editingCategoryId ? 'Категория обновлена.' : 'Категория добавлена.');
    resetCategoryForm();
    loadCategories();
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({ name: product.name || '', description: product.description || '', price: product.price || '', stock: product.stock || '', categoryId: product.categoryId || '' });
    setImageFile(null);
    setImagePreview(product.imageUrl ? `${API}${product.imageUrl.startsWith('/uploads') ? product.imageUrl : ''}` : '');
    setProductMessage({ text: '', type: '' });
    setActiveTab('products');
  };

  const handleDeleteProduct = (id) => {
    setConfirm({
      message: 'Удалить этот товар? Действие необратимо.',
      onConfirm: async () => {
        setConfirm(null);
        const res = await authFetch(`${API}/api/products/${id}`, { method: 'DELETE' });
        if (!res) return;
        const data = await res.json();
        if (!res.ok) { notify(setProductMessage, data.message || 'Не удалось удалить товар.', 'error'); return; }
        notify(setProductMessage, 'Товар удалён.');
        if (editingProductId === id) resetProductForm();
        loadProducts();
      },
    });
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name || '' });
    setCategoryMessage('');
    setActiveTab('categories');
  };

  const handleDeleteCategory = (id) => {
    setConfirm({
      message: 'Удалить эту категорию? Действие необратимо.',
      onConfirm: async () => {
        setConfirm(null);
        const res = await authFetch(`${API}/api/categories/${id}`, { method: 'DELETE' });
        if (!res) return;
        const data = await res.json();
        if (!res.ok) { setCategoryMessage(data.message || 'Не удалось удалить категорию.'); return; }
        setCategoryMessage('Категория удалена.');
        if (editingCategoryId === id) resetCategoryForm();
        loadCategories();
      },
    });
  };

  const handleStatusChange = async (orderId, status) => {
    setOrderMessage('');
    const res = await authFetch(`${API}/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { setOrderMessage(data.message || 'Не удалось обновить статус.'); return; }
    setOrderMessage('Статус заказа обновлён.');
    loadOrders(orderSearch);
    loadStats();
  };

  const handleExportCSV = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/orders/export/csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { setOrderMessage('Ошибка при экспорте CSV.'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const TABS = [
    { id: 'stats',      label: 'Статистика' },
    { id: 'categories', label: `Категории${categories.length ? ` (${categories.length})` : ''}` },
    { id: 'products',   label: `Товары${products.length ? ` (${products.length})` : ''}` },
    { id: 'orders',     label: `Заказы${orders.length ? ` (${orders.length})` : ''}` },
    { id: 'banner',     label: 'Баннер' },
    { id: 'promos',     label: `Промокоды${promos.length ? ` (${promos.length})` : ''}` },
  ];

  return (
    <section>
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 500, marginBottom: 28 }}>
        Админ-панель
      </h1>

      {/* Tabs */}
      <div className="tab-row" style={{ marginBottom: 32 }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`tab-btn${activeTab === id ? ' active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── STATS ── */}
      {activeTab === 'stats' && (
        <div>
          {statsLoading ? (
            <p style={{ color: 'var(--stone)' }}>Загрузка статистики...</p>
          ) : !stats ? (
            <p style={{ color: 'var(--stone)' }}>Не удалось загрузить статистику.</p>
          ) : (
            <>
              {/* Карточки без эмодзи, тёмный фон */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
                {[
                  { label: 'Всего заказов',  value: stats.totalOrders },
                  { label: 'Новых заказов',  value: stats.newOrders },
                  { label: 'Выручка',        value: `${Number(stats.totalRevenue || 0).toLocaleString('ru-RU')} ₽` },
                  { label: 'Покупателей',    value: stats.totalUsers },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                      {s.label}
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, lineHeight: 1, color: 'var(--gold-2)', fontWeight: 500 }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Orders by status */}
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '4px 16px', marginBottom: 32, maxWidth: 380 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)', textTransform: 'uppercase', padding: '12px 0 8px' }}>
                  Заказы по статусам
                </div>
                {stats.ordersByStatus?.map((s) => (
                  <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
                    <span style={{ color: 'var(--stone)' }}>{STATUS_LABELS[s.status] || s.status}</span>
                    <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{s._count.id} шт.</span>
                  </div>
                ))}
              </div>

              {/* Top products */}
              {stats.topProducts?.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, marginBottom: 14 }}>
                    Топ товаров по продажам
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stats.topProducts.map((p, i) => (
                      <div key={p.productId} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: 'var(--bg-2)', border: '1px solid var(--line)',
                        padding: '10px 16px',
                      }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: 'var(--gold)', width: 24 }}>
                          {i + 1}
                        </span>
                        <span style={{ flex: 1, fontWeight: 500 }}>{p.product?.name || `ID ${p.productId}`}</span>
                        <span style={{ fontSize: 13, color: 'var(--stone)', fontFamily: "'JetBrains Mono', monospace" }}>{p._sum?.quantity || 0} шт.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent orders */}
              {stats.recentOrders?.length > 0 && (
                <div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, marginBottom: 14 }}>
                    Последние заказы
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stats.recentOrders.map((o) => (
                      <div key={o.id} style={{
                        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                        background: 'var(--bg-2)', border: '1px solid var(--line)',
                        padding: '10px 16px',
                      }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--gold)' }}>#{o.id}</span>
                        <span style={{ flex: 1, color: 'var(--stone)', fontSize: 13 }}>{o.user?.fullName}</span>
                        <span style={{ fontWeight: 600 }}>{o.totalPrice?.toLocaleString('ru-RU')} ₽</span>
                        <span style={{ fontSize: 12, color: 'var(--stone)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {new Date(o.createdAt).toLocaleString('ru-RU')}
                        </span>
                        <span className={`order-status ${o.status}`} style={{ fontSize: 11 }}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── CATEGORIES ── */}
      {activeTab === 'categories' && (
        <div className="admin-section">
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, marginBottom: 20 }}>
            Управление категориями
          </h2>
          <form className="order-form" onSubmit={handleCategorySubmit}>
            <input type="text" name="name" placeholder="Название категории" value={categoryForm.name} onChange={handleCategoryChange} />
            <div className="admin-form-actions">
              <button type="submit" className="btn btn--gold">
                {editingCategoryId ? 'Сохранить категорию' : 'Добавить категорию'}
              </button>
              {editingCategoryId && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={resetCategoryForm}>Отмена</button>
              )}
            </div>
          </form>
          {categoryMessage && <p className="order-message">{categoryMessage}</p>}
          <div className="admin-product-list">
            {categories.map((category) => (
              <div key={category.id} className="admin-product-item">
                <strong>{category.name}</strong>
                <div className="admin-product-actions">
                  <button onClick={() => handleEditCategory(category)}>Редактировать</button>
                  <button onClick={() => handleDeleteCategory(category.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRODUCTS ── */}
      {activeTab === 'products' && (
        <div className="admin-section">
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, marginBottom: 20 }}>
            {editingProductId ? 'Редактирование товара' : 'Добавление товара'}
          </h2>
          <form className="order-form" onSubmit={handleProductSubmit}>
            <input type="text" name="name" placeholder="Название товара" value={productForm.name} onChange={handleProductChange} />
            <textarea name="description" placeholder="Описание товара" value={productForm.description} onChange={handleProductChange} className="admin-textarea" />
            <input type="number" name="price" placeholder="Цена (₽)" value={productForm.price} onChange={handleProductChange} />
            <input type="number" name="stock" placeholder="Количество на складе" value={productForm.stock} onChange={handleProductChange} />
            <select name="categoryId" value={productForm.categoryId} onChange={handleProductChange} className="admin-select">
              <option value="">Выберите категорию</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="form-group">
              <label className="form-label">Фотография товара</label>
              <label className="image-upload-label">
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ display: 'none' }} />
                <span className="image-upload-btn">{imageFile ? 'Заменить фото' : 'Выбрать фото'}</span>
                <span style={{ fontSize: 12, color: 'var(--stone)', marginLeft: 8 }}>JPG, PNG, WebP · до 5 МБ</span>
              </label>
              {imagePreview && (
                <div style={{ marginTop: 10, position: 'relative', display: 'inline-block' }}>
                  <img src={imagePreview} alt="Превью" style={{ width: 160, height: 110, objectFit: 'cover', border: '1px solid var(--line)', display: 'block' }} />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(''); setImageFile(null); setProductForm(p => ({ ...p, imageUrl: '' })); }}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'var(--danger)', color: 'white',
                      border: 'none', cursor: 'pointer', fontSize: 14,
                      display: 'grid', placeItems: 'center', lineHeight: 1,
                    }}
                  >×</button>
                </div>
              )}
              {!imagePreview && editingProductId && (
                <p style={{ fontSize: 12, color: 'var(--stone)', marginTop: 6 }}>Фото не изменится, если не выбрать новое</p>
              )}
            </div>

            {/* Дополнительные фото — только при редактировании */}
            {editingProductId && (
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Дополнительные фото</label>

                {/* Существующие доп. фото */}
                {(products.find(p => p.id === editingProductId)?.images || []).length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {(products.find(p => p.id === editingProductId)?.images || []).map((img, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img
                          src={img.startsWith('/') ? `${API}${img}` : img}
                          alt={`доп. фото ${i + 1}`}
                          style={{ width: 72, height: 72, objectFit: 'cover', border: '1px solid var(--line)', display: 'block' }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await fetch(`${API}/api/products/${editingProductId}/images`, {
                              method: 'DELETE',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                              },
                              body: JSON.stringify({ imageUrl: img }),
                            });
                            if (res.ok) { loadProducts(); notify(setProductMessage, 'Фото удалено'); }
                          }}
                          style={{
                            position: 'absolute', top: -6, right: -6,
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'var(--danger)', color: 'white',
                            border: 'none', cursor: 'pointer', fontSize: 14,
                            display: 'grid', placeItems: 'center', lineHeight: 1,
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Загрузить ещё фото */}
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', border: '1px dashed var(--line-strong)',
                  background: 'var(--bg)', cursor: 'pointer', fontSize: 13, color: 'var(--stone)',
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append('image', file);
                      const res = await fetch(`${API}/api/products/${editingProductId}/images`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                        body: fd,
                      });
                      if (res.ok) { loadProducts(); notify(setProductMessage, 'Фото добавлено'); }
                      else { notify(setProductMessage, 'Ошибка загрузки', 'error'); }
                    }}
                  />
                  + Добавить фото
                </label>
              </div>
            )}

            <div className="admin-form-actions">
              <button type="submit" className="btn btn--gold">
                {editingProductId ? 'Сохранить изменения' : 'Добавить товар'}
              </button>
              {editingProductId && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={resetProductForm}>Отмена</button>
              )}
            </div>
          </form>
          {productMessage.text && (
            <div style={{
              marginTop: 12, padding: '10px 14px', fontSize: 13,
              background: productMessage.type === 'ok' ? 'rgba(95,174,90,.12)' : 'rgba(192,83,58,.12)',
              color: productMessage.type === 'ok' ? 'var(--ok)' : 'var(--danger)',
              border: `1px solid ${productMessage.type === 'ok' ? 'rgba(95,174,90,.3)' : 'rgba(192,83,58,.3)'}`,
            }}>
              {productMessage.text}
            </div>
          )}

          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, marginTop: 32, marginBottom: 16 }}>
            Список товаров
          </h2>
          {products.length === 0 ? (
            <p style={{ color: 'var(--stone)' }}>Товаров пока нет.</p>
          ) : (
            <div className="admin-product-list">
              {products.map((product) => (
                <div key={product.id} className="admin-product-item">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl.startsWith('/uploads') ? `${API}${product.imageUrl}` : product.imageUrl}
                      alt={product.name}
                      style={{ width: 64, height: 48, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--line)' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <strong>{product.name}</strong>
                    <div style={{ fontSize: 13, color: 'var(--stone)' }}>Категория: {product.category?.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--stone)' }}>Цена: {product.price.toLocaleString('ru-RU')} ₽ · Остаток: {product.stock} шт.</div>
                  </div>
                  <div className="admin-product-actions">
                    <button onClick={() => handleEditProduct(product)}>Редактировать</button>
                    <button onClick={() => handleDeleteProduct(product.id)}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ORDERS ── */}
      {activeTab === 'orders' && (
        <div className="admin-section">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500 }}>Заказы</h2>
            <input
              type="text"
              placeholder="Поиск по имени или номеру..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="catalog-search-input"
              style={{ flex: 1, minWidth: 200, maxWidth: 320 }}
            />
            <button className="btn btn--ghost btn--sm" onClick={handleExportCSV}>
              Экспорт CSV
            </button>
          </div>
          {orderMessage && <p className="order-message">{orderMessage}</p>}
          {orders.length === 0 ? (
            <p style={{ color: 'var(--stone)' }}>Заказов не найдено.</p>
          ) : (
            <div className="admin-product-list">
              {orders.map((order) => (
                <div key={order.id} className="admin-order-item">
                  <div className="admin-order-main">
                    <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--gold)' }}>Заказ #{order.id}</strong>
                    <div>Покупатель: {order.user?.fullName}</div>
                    <div style={{ fontSize: 13, color: 'var(--stone)' }}>Email: {order.user?.email}</div>
                    {order.user?.phone && (
                      <div style={{ fontSize: 13, color: 'var(--stone)' }}>Тел: {order.user.phone}</div>
                    )}
                    {order.user?.city ? (
                      <div style={{ fontSize: 13, color: 'var(--stone)' }}>
                        Адрес: {[order.user.city, order.user.street, order.user.house && `д.${order.user.house}`, order.user.apartment && `кв.${order.user.apartment}`].filter(Boolean).join(', ')}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--stone)', fontStyle: 'italic' }}>Адрес не указан</div>
                    )}
                    <div style={{ fontWeight: 600 }}>Сумма: {order.totalPrice?.toLocaleString('ru-RU')} ₽</div>
                    <div style={{ fontSize: 12, color: 'var(--stone)' }}>Дата: {new Date(order.createdAt).toLocaleString('ru-RU')}</div>
                    <span className={`order-status ${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
                  </div>
                  <div className="admin-order-items">
                    <strong>Состав заказа:</strong>
                    {order.items.map((item) => (
                      <div key={item.id} style={{ fontSize: 13, color: 'var(--stone)' }}>
                        {item.product?.name} — {item.quantity} шт. × {item.price?.toLocaleString('ru-RU')} ₽
                      </div>
                    ))}
                  </div>
                  <div className="admin-order-actions">
                    {ORDER_STATUSES.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(order.id, key)}
                        style={{
                          fontWeight: order.status === key ? 700 : 400,
                          borderColor: order.status === key ? 'var(--gold)' : undefined,
                          color: order.status === key ? 'var(--gold)' : undefined,
                          background: order.status === key ? 'rgba(232,184,75,.1)' : undefined,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BANNER ── */}
      {activeTab === 'banner' && (
        <div className="admin-section">
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
            Hero-баннер главной страницы
          </h2>
          <p style={{ color: 'var(--stone)', fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
            Загрузите фото которое будет отображаться в правой части hero-секции на главной странице.
            Меняйте к праздникам (Наадым, Шагаа и др.)
          </p>

          {heroPreview && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>
                Текущий баннер
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={heroPreview} alt="hero preview"
                  style={{ maxWidth: 400, maxHeight: 300, objectFit: 'cover', border: '1px solid var(--line)', display: 'block' }} />
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(`${API}/api/settings/hero`, {
                      method: 'DELETE',
                      headers: authHeaders,
                    });
                    if (res.ok) { setHeroPreview(null); notify(setProductMessage, 'Баннер удалён'); }
                    else notify(setProductMessage, 'Ошибка удаления', 'error');
                  }}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--danger)', color: 'white',
                    border: 'none', cursor: 'pointer', fontSize: 14,
                    display: 'grid', placeItems: 'center', lineHeight: 1,
                  }}
                >×</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
            <div className="form-group">
              <label className="form-label">Загрузить новое фото</label>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 18px',
                background: 'var(--bg)',
                border: '1.5px dashed var(--line-strong)',
                cursor: 'pointer',
                fontSize: 13, color: 'var(--stone)',
                transition: 'border-color .2s',
              }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setHeroPreview(URL.createObjectURL(file));
                    setHeroLoading(true);
                    const fd = new FormData();
                    fd.append('image', file);
                    try {
                      const res = await fetch(`${API}/api/settings/hero`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                        body: fd,
                      });
                      const data = await res.json();
                      if (res.ok) notify(setProductMessage, 'Баннер обновлён!');
                      else notify(setProductMessage, data.message || 'Ошибка', 'error');
                    } catch { notify(setProductMessage, 'Ошибка загрузки', 'error'); }
                    finally { setHeroLoading(false); }
                  }}
                />
                {heroLoading ? 'Загрузка...' : 'Выбрать файл (JPG, PNG, WebP · до 5 МБ)'}
              </label>
            </div>

            {productMessage.text && (
              <div style={{
                padding: '10px 14px', fontSize: 13,
                background: productMessage.type === 'ok' ? 'rgba(95,174,90,.12)' : 'rgba(192,83,58,.12)',
                color: productMessage.type === 'ok' ? 'var(--ok)' : 'var(--danger)',
                border: `1px solid ${productMessage.type === 'ok' ? 'rgba(95,174,90,.3)' : 'rgba(192,83,58,.3)'}`,
              }}>
                {productMessage.text}
              </div>
            )}

            <div style={{ fontSize: 12, color: 'var(--stone)', lineHeight: 1.6, padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
              <strong style={{ color: 'var(--gold)' }}>Подсказка:</strong> Рекомендуемый размер — 800×1000px.
              Фото будет обрезано по соотношению 4:5. Меняйте к праздникам: Наадым (август), Шагаа (февраль), День Республики Тыва (октябрь).
            </div>
          </div>

          {/* ── Настройки секции Наадым ── */}
          <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid var(--line)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, marginBottom: 20 }}>
              Настройка секции Наадым
            </h3>

            {/* Видимость */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: 14, color: 'var(--paper)', flex: 1 }}>Показывать секцию Наадым на главной странице</span>
              <button
                onClick={() => setNaadymForm(p => ({ ...p, naadymVisible: !p.naadymVisible }))}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: naadymForm.naadymVisible ? 'var(--gold)' : 'var(--bg-3)',
                  position: 'relative', transition: 'background .2s', flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: 3,
                  left: naadymForm.naadymVisible ? 'calc(100% - 22px)' : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--paper)', transition: 'left .2s',
                }} />
              </button>
              <span style={{ fontSize: 12, color: naadymForm.naadymVisible ? 'var(--ok)' : 'var(--stone)', fontFamily: "'JetBrains Mono', monospace" }}>
                {naadymForm.naadymVisible ? 'Видна' : 'Скрыта'}
              </span>
            </div>

            <div className="admin-form-grid">
              <div className="form-group">
                <label className="form-label">Заголовок</label>
                <input className="admin-input" placeholder="НААДЫМ 2026"
                  value={naadymForm.naadymTitle}
                  onChange={e => setNaadymForm(p => ({ ...p, naadymTitle: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Подзаголовок</label>
                <input className="admin-input" placeholder="Праздник трёх игр"
                  value={naadymForm.naadymSubtitle}
                  onChange={e => setNaadymForm(p => ({ ...p, naadymSubtitle: e.target.value }))} />
              </div>
              <div className="form-group span-2">
                <label className="form-label">Текст описания</label>
                <textarea className="admin-textarea" rows={3}
                  placeholder="Национальный праздник Тывы..."
                  value={naadymForm.naadymText}
                  onChange={e => setNaadymForm(p => ({ ...p, naadymText: e.target.value }))}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Промокод для отображения</label>
                <select className="admin-input" value={naadymForm.naadymPromoCode}
                  onChange={e => setNaadymForm(p => ({ ...p, naadymPromoCode: e.target.value }))}>
                  <option value="">— Не показывать промокод —</option>
                  {promos.filter(p => p.isActive).map(p => (
                    <option key={p.id} value={p.code}>{p.code} (-{p.discount}%)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Текст рядом с промокодом</label>
                <input className="admin-input" placeholder="скидка 10%"
                  value={naadymForm.naadymPromoText}
                  onChange={e => setNaadymForm(p => ({ ...p, naadymPromoText: e.target.value }))} />
              </div>
            </div>

            <button
              className="btn btn--gold"
              style={{ marginTop: 16 }}
              onClick={async () => {
                const res = await fetch(`${API}/api/settings/hero`, {
                  method: 'POST',
                  headers: authHeaders,
                  body: JSON.stringify(naadymForm),
                });
                if (res.ok) notify(setProductMessage, 'Настройки Наадым сохранены!');
                else notify(setProductMessage, 'Ошибка сохранения', 'error');
              }}
            >
              Сохранить настройки Наадым
            </button>
          </div>
        </div>
      )}
      {/* ── PROMOS ── */}
      {activeTab === 'promos' && (
        <div className="admin-card">
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, margin: '0 0 24px' }}>Промокоды</h2>

          {promoMessage.text && (
            <div style={{
              padding: '10px 14px', marginBottom: 20, fontSize: 13,
              background: promoMessage.type === 'ok' ? 'rgba(95,174,90,.12)' : 'rgba(192,83,58,.12)',
              color: promoMessage.type === 'ok' ? 'var(--ok)' : 'var(--danger)',
              border: `1px solid ${promoMessage.type === 'ok' ? 'rgba(95,174,90,.3)' : 'rgba(192,83,58,.3)'}`,
            }}>
              {promoMessage.text}
            </div>
          )}

          {/* Форма создания */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 24, marginBottom: 28 }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, marginBottom: 18 }}>Создать промокод</h3>
            <div className="admin-form-grid">
              <div className="form-group">
                <label className="form-label">Код промокода</label>
                <input
                  className="admin-input"
                  placeholder="Например: ЛЕТО2026"
                  value={promoForm.code}
                  onChange={e => setPromoForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Скидка (%)</label>
                <input
                  className="admin-input"
                  type="number"
                  min="1" max="100"
                  placeholder="Например: 15"
                  value={promoForm.discount}
                  onChange={e => setPromoForm(p => ({ ...p, discount: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Лимит использований (пусто = без лимита)</label>
                <input
                  className="admin-input"
                  type="number"
                  min="1"
                  placeholder="Например: 100"
                  value={promoForm.usageLimit}
                  onChange={e => setPromoForm(p => ({ ...p, usageLimit: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Действует до (пусто = бессрочно)</label>
                <input
                  className="admin-input"
                  type="date"
                  value={promoForm.expiresAt}
                  onChange={e => setPromoForm(p => ({ ...p, expiresAt: e.target.value }))}
                />
              </div>
            </div>
            <button
              className="btn btn--gold"
              style={{ marginTop: 16 }}
              onClick={async () => {
                if (!promoForm.code || !promoForm.discount) {
                  notify(setPromoMessage, 'Заполните код и скидку', 'error'); return;
                }
                const res = await fetch(`${API}/api/promos`, {
                  method: 'POST',
                  headers: authHeaders,
                  body: JSON.stringify(promoForm),
                });
                const data = await res.json();
                if (!res.ok) { notify(setPromoMessage, data.message, 'error'); return; }
                notify(setPromoMessage, `Промокод ${data.code} создан!`);
                setPromoForm({ code: '', discount: '', usageLimit: '', expiresAt: '', isActive: true });
                loadPromos();
              }}
            >
              Создать промокод
            </button>
          </div>

          {/* Список промокодов */}
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, marginBottom: 16 }}>
            Список промокодов {promos.length > 0 && <span style={{ fontSize: 14, color: 'var(--stone)', fontFamily: 'Manrope, sans-serif' }}>({promos.length})</span>}
          </h3>
          {promos.length === 0 ? (
            <div style={{ color: 'var(--stone)', padding: '24px 0', fontStyle: 'italic' }}>Промокодов пока нет</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {promos.map(promo => (
                <div key={promo.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto auto',
                  gap: 16, alignItems: 'center',
                  padding: '16px 20px',
                  background: 'var(--bg)',
                  border: `1px solid ${promo.isActive ? 'var(--line)' : 'var(--stone-dim)'}`,
                  opacity: promo.isActive ? 1 : 0.6,
                }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: 'var(--gold-2)', fontWeight: 700, letterSpacing: '.08em' }}>
                      {promo.code}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--stone)', marginTop: 4 }}>
                      Использовано: {promo.usageCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ''} раз
                      {promo.expiresAt && ` · До: ${new Date(promo.expiresAt).toLocaleDateString('ru-RU')}`}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: 'var(--gold)', fontWeight: 700 }}>
                    -{promo.discount}%
                  </div>
                  <div>
                    <span style={{
                      padding: '4px 10px', fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '.1em', textTransform: 'uppercase',
                      background: promo.isActive ? 'rgba(95,174,90,.12)' : 'rgba(192,83,58,.12)',
                      color: promo.isActive ? 'var(--ok)' : 'var(--danger)',
                      border: `1px solid ${promo.isActive ? 'rgba(95,174,90,.3)' : 'rgba(192,83,58,.3)'}`,
                    }}>
                      {promo.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  <button
                    className="btn btn--dark btn--sm"
                    onClick={async () => {
                      await fetch(`${API}/api/promos/${promo.id}`, {
                        method: 'PATCH',
                        headers: authHeaders,
                        body: JSON.stringify({ isActive: !promo.isActive }),
                      });
                      loadPromos();
                    }}
                  >
                    {promo.isActive ? 'Деактивировать' : 'Активировать'}
                  </button>
                  <button
                    className="btn btn--sm"
                    style={{ background: 'var(--danger)', color: 'white', border: 'none' }}
                    onClick={async () => {
                      if (!window.confirm(`Удалить промокод ${promo.code}?`)) return;
                      await fetch(`${API}/api/promos/${promo.id}`, {
                        method: 'DELETE', headers: authHeaders,
                      });
                      loadPromos();
                    }}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </section>
  );
}

export default AdminPage;
