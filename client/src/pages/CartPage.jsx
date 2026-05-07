import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../utils/api";
import { useCart } from "../context/CartContext";

const API = import.meta.env.VITE_API_URL;

function CartPage() {
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    localStorage.removeItem("currentUser");
    currentUser = null;
  }

  const cartKey = currentUser ? `cart_${currentUser.id}` : "cart_guest";
  const { refreshCart } = useCart();

  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem(cartKey) || "[]"));
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

  const totalPrice = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const totalCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const handleCheckout = async () => {
    if (!currentUser) { setMessage("Сначала войдите в аккаунт."); return; }
    if (cart.length === 0) { setMessage("Корзина пуста."); return; }
    if (!profile?.phone || !profile?.address) {
      setMessage("Заполните телефон и адрес доставки в личном кабинете.");
      return;
    }

    setOrdering(true);
    const res = await authFetch(`${API}/api/orders`, {
      method: "POST",
      body: JSON.stringify({ items: cart }),
    });
    setOrdering(false);
    if (!res) return;

    const data = await res.json();
    if (!res.ok) { setMessage(data.message || "Не удалось оформить заказ."); return; }

    localStorage.removeItem(cartKey);
    setCart([]);
    refreshCart();
    setMessage("✅ Заказ успешно оформлен! Отслеживайте статус в личном кабинете.");
  };

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Корзина пуста</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>
          Добавьте товары из каталога, чтобы оформить заказ
        </p>
        {message && <p className="order-message">{message}</p>}
        <Link to="/catalog" className="btn-hero-primary">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>
        Корзина <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-muted)" }}>
          {totalCount} {totalCount === 1 ? "товар" : totalCount < 5 ? "товара" : "товаров"}
        </span>
      </h1>

      <div className="cart-layout">
        {/* Items */}
        <div className="cart-list">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img
                src={item.imageUrl || "https://via.placeholder.com/72x72?text="}
                alt={item.name}
                className="cart-item-image"
              />
              <div className="cart-item-info">
                <div className="cart-item-name">
                  <Link to={`/product/${item.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {item.name}
                  </Link>
                </div>
                <div className="cart-item-price">{item.price.toLocaleString("ru-RU")} ₽ за шт.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => decrease(item.id)}>−</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => increase(item)}>+</button>
                </div>
                <span className="cart-item-total">
                  {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                </span>
                <button className="cart-item-remove" onClick={() => remove(item.id)} title="Удалить">✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="cart-summary">
          <div className="cart-summary-title">Итого</div>

          <div className="cart-summary-row">
            <span>Товаров</span>
            <span>{totalCount}</span>
          </div>
          <div className="cart-summary-row">
            <span>Стоимость товаров</span>
            <span>{totalPrice.toLocaleString("ru-RU")} ₽</span>
          </div>
          <div className="cart-summary-row">
            <span>Доставка</span>
            <span style={{ color: "var(--green)", fontWeight: 600 }}>Уточняется</span>
          </div>
          <div className="cart-summary-total">
            <span>Итого</span>
            <span>{totalPrice.toLocaleString("ru-RU")} ₽</span>
          </div>

          {/* Delivery info */}
          {profile ? (
            <div className="profile-preview">
              <p><strong>Получатель:</strong> {profile.fullName}</p>
              <p><strong>Телефон:</strong> {profile.phone || <span style={{ color: "var(--red)" }}>не указан</span>}</p>
              <p><strong>Адрес:</strong> {profile.address || <span style={{ color: "var(--red)" }}>не указан</span>}</p>
            </div>
          ) : (
            <div className="profile-preview">
              <p style={{ color: "var(--text-muted)" }}>
                Заполните <Link to="/account" style={{ color: "var(--accent-dark)", fontWeight: 600 }}>данные профиля</Link> для оформления заказа
              </p>
            </div>
          )}

          <button
            className="buy-button"
            style={{ width: "100%", padding: "14px", fontSize: 15 }}
            onClick={handleCheckout}
            disabled={ordering}
          >
            {ordering ? "Оформляем..." : "Оформить заказ"}
          </button>

          {message && (
            <div className="order-message" style={{ marginTop: 12 }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartPage;
