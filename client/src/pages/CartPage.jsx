import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../utils/api';
import { useCart } from '../context/CartContext';

const API = import.meta.env.VITE_API_URL;

function CartPage() {
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch {
    localStorage.removeItem('currentUser');
    currentUser = null;
  }

  const cartKey = currentUser ? `cart_${currentUser.id}` : 'cart_guest';
  const { refreshCart } = useCart();

  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [ordering, setOrdering] = useState(false);

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('card');

  // Promo
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [appliedPromoPercent, setAppliedPromoPercent] = useState(0);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem(cartKey) || '[]'));
  }, [cartKey]);

  useEffect(() => {
    if (!currentUser) return;
    authFetch(`${API}/api/auth/me`).then(async (res) => {
      if (res?.ok) setProfile(await res.json());
    });
  }, []);

  const updateCart = (updated) => {
    setCart(updated);
    localStorage.setItem(cartKey, JSON.stringify(updated));
    refreshCart();
  };

  const increase = (item) =>
    updateCart(cart.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)));

  const decrease = (id) =>
    updateCart(
      cart.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i)).filter((i) => i.quantity > 0)
    );

  const remove = (id) => updateCart(cart.filter((i) => i.id !== id));

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const totalPrice = subtotal;
  const totalCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const finalPrice = subtotal - promoDiscount;

  const applyPromo = async () => {
    const code = promoCode.toUpperCase().trim();
    if (!code) return;
    try {
      const res = await fetch(`${API}/api/promos/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.message);
        setPromoApplied(false);
        return;
      }
      setPromoApplied(true);
      setPromoDiscount(Math.round(subtotal * data.discount / 100));
      setAppliedPromoCode(code);
      setAppliedPromoPercent(data.discount);
      setPromoError('');
    } catch {
      setPromoError('Ошибка проверки промокода');
    }
  };

  const openPayModal = () => {
    if (!currentUser) { setMessage({ text: 'Сначала войдите в аккаунт.', type: 'error' }); return; }
    if (cart.length === 0) { setMessage({ text: 'Корзина пуста.', type: 'error' }); return; }
    if (!profile?.fullName || !profile?.phone || !profile?.city || !profile?.street || !profile?.house) {
      setMessage({ text: 'Заполните данные профиля (включая адрес доставки) в личном кабинете.', type: 'error' });
      return;
    }
    setShowPayModal(true);
  };

  const handleCheckout = async () => {
    setOrdering(true);
    const res = await authFetch(`${API}/api/orders`, {
      method: 'POST',
      body: JSON.stringify({
        items: cart.map(item => ({ productId: item.id, quantity: item.qty || item.quantity || 1 })),
        promoCode: appliedPromoCode || null,
      }),
    });
    setOrdering(false);
    setShowPayModal(false);
    if (!res) return;

    const data = await res.json();
    if (!res.ok) {
      setMessage({ text: data.message || 'Не удалось оформить заказ.', type: 'error' });
      return;
    }

    localStorage.removeItem(cartKey);
    setCart([]);
    refreshCart();
    setMessage({ text: '✅ Заказ успешно оформлен! Отслеживайте статус в личном кабинете.', type: 'ok' });
  };

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 500, marginBottom: 8 }}>
          Корзина пуста
        </h2>
        <p style={{ color: 'var(--stone)', marginBottom: 28 }}>
          Добавьте товары из каталога, чтобы оформить заказ
        </p>
        {message.text && (
          <p style={{ color: message.type === 'ok' ? 'var(--ok)' : 'var(--danger)', marginBottom: 20 }}>
            {message.text}
          </p>
        )}
        <Link to="/catalog" className="btn btn--gold btn--lg">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 36, fontWeight: 500, marginBottom: 28,
      }}>
        Корзина{' '}
        <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--stone)', fontFamily: 'Manrope, sans-serif' }}>
          {totalCount} {totalCount === 1 ? 'товар' : totalCount < 5 ? 'товара' : 'товаров'}
        </span>
      </h1>

      <div className="cart-layout">
        {/* ── Список товаров ── */}
        <div className="cart-list">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img
                src={item.imageUrl || 'https://via.placeholder.com/72x72?text='}
                alt={item.name}
                className="cart-item-image"
              />
              <div className="cart-item-info">
                <div className="cart-item-name">
                  <Link to={`/product/${item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {item.name}
                  </Link>
                </div>
                <div className="cart-item-price">{item.price.toLocaleString('ru-RU')} ₽ за шт.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => decrease(item.id)}>−</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => increase(item)}>+</button>
                </div>
                <span className="cart-item-total">
                  {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                </span>
                <button className="cart-item-remove" onClick={() => remove(item.id)} title="Удалить">✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Сводка ── */}
        <div className="cart-summary-section">
          <div className="cart-summary-title">Итого</div>

          <div className="summary-row">
            <span>Товаров</span>
            <span>{totalCount}</span>
          </div>
          <div className="summary-row">
            <span>Стоимость</span>
            <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
          {promoApplied && (
            <div className="summary-row" style={{ color: 'var(--ok)' }}>
              <span>Скидка {appliedPromoPercent}%</span>
              <span>−{promoDiscount.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
          <div className="summary-row">
            <span>Доставка</span>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Уточняется</span>
          </div>
          <div className="summary-total">
            <span>Итого</span>
            <span>{finalPrice.toLocaleString('ru-RU')} ₽</span>
          </div>

          {/* Промокод */}
          {promoApplied ? (
            <div className="promo-applied">
              <span>{appliedPromoCode} — скидка {appliedPromoPercent}% применена</span>
              <button onClick={() => { setPromoApplied(false); setPromoCode(''); setPromoDiscount(0); setAppliedPromoCode(''); setAppliedPromoPercent(0); }} style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
          ) : (
            <>
              <div className="promo-row">
                <input
                  placeholder="Промокод"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                />
                <button className="btn btn--ghost btn--sm" onClick={applyPromo}>Применить</button>
              </div>
              {promoError && <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>{promoError}</div>}
            </>
          )}

          {/* Адрес доставки */}
          {profile ? (
            <div className="profile-preview">
              <p><strong>Получатель:</strong> {profile.fullName}</p>
              <p><strong>Телефон:</strong> {profile.phone || <span style={{ color: 'var(--danger)' }}>не указан</span>}</p>
              <p>
                <strong>Адрес:</strong>{' '}
                {[profile.city, profile.street, profile.house && `д. ${profile.house}`, profile.apartment && `кв. ${profile.apartment}`]
                  .filter(Boolean).join(', ') || <span style={{ color: 'var(--danger)' }}>не указан</span>}
              </p>
            </div>
          ) : (
            <div className="profile-preview">
              <p style={{ color: 'var(--stone)' }}>
                Заполните{' '}
                <Link to="/account" style={{ color: 'var(--gold)', fontWeight: 600 }}>данные профиля</Link>{' '}
                для оформления заказа
              </p>
            </div>
          )}

          <button
            className="btn btn--gold btn--full"
            style={{ marginTop: 4, fontSize: 15, padding: '14px' }}
            onClick={openPayModal}
          >
            Оформить заказ
          </button>

          {message.text && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 'var(--r-md)',
              fontSize: 13, lineHeight: 1.5,
              background: message.type === 'ok' ? 'rgba(95,174,90,.12)' : 'rgba(192,83,58,.12)',
              color: message.type === 'ok' ? 'var(--ok)' : 'var(--danger)',
              border: `1px solid ${message.type === 'ok' ? 'rgba(95,174,90,.3)' : 'rgba(192,83,58,.3)'}`,
            }}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* ── Модалка оплаты ── */}
      {showPayModal && (
        <div className="modal-backdrop" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <span>Способ оплаты</span>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>

            <div className="modal__body">
              <div style={{ fontSize: 13, color: 'var(--stone)', marginBottom: 20 }}>
                Итого к оплате:{' '}
                <span style={{ color: 'var(--paper)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 16 }}>
                  {finalPrice.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <div className="pay-methods">
                {[
                  { id: 'card', icon: '💳', label: 'Банковская карта', desc: 'Visa, Mastercard, МИР' },
                  { id: 'sbp', icon: '⚡', label: 'СБП', desc: 'Система быстрых платежей' },
                  { id: 'cash', icon: '💵', label: 'Наличные', desc: 'При получении' },
                ].map((m) => (
                  <button
                    key={m.id}
                    className={`pay-method${payMethod === m.id ? ' is-active' : ''}`}
                    onClick={() => setPayMethod(m.id)}
                  >
                    <span style={{ fontSize: 22 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--stone)' }}>{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {promoApplied && (
                <div style={{
                  padding: '8px 12px', background: 'rgba(95,174,90,.08)',
                  border: '1px solid rgba(95,174,90,.25)', borderRadius: 'var(--r-sm)',
                  fontSize: 12, color: 'var(--ok)', marginTop: 12,
                }}>
                  Промокод {appliedPromoCode} — скидка {promoDiscount.toLocaleString('ru-RU')} ₽ применена
                </div>
              )}
            </div>

            <div className="modal__foot">
              <button className="btn btn--ghost btn--sm" onClick={() => setShowPayModal(false)}>
                Отмена
              </button>
              <button
                className="btn btn--gold"
                onClick={handleCheckout}
                disabled={ordering}
                style={{ minWidth: 160 }}
              >
                {ordering ? 'Оформляем...' : `Оплатить ${finalPrice.toLocaleString('ru-RU')} ₽`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
