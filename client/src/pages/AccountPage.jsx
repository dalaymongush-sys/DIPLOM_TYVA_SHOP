import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../utils/api";

const API = import.meta.env.VITE_API_URL;

const STATUS_LABELS = {
  NEW: "Новый",
  PROCESSING: "В обработке",
  DONE: "Выполнен",
  CANCELLED: "Отменён",
};

function AccountPage() {
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    currentUser = null;
  }

  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "", address: "" });
  const [orders, setOrders] = useState([]);
  const [profileMsg, setProfileMsg] = useState("");
  const [cancelMsg, setCancelMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!currentUser) return;

    authFetch(`${API}/api/auth/me`).then(async (res) => {
      if (res?.ok) {
        const d = await res.json();
        setProfile({ fullName: d.fullName || "", email: d.email || "", phone: d.phone || "", address: d.address || "" });
      }
    });

    authFetch(`${API}/api/orders/my`).then(async (res) => {
      if (res?.ok) setOrders(await res.json());
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setSaving(true);
    const res = await authFetch(`${API}/api/auth/me`, {
      method: "PATCH",
      body: JSON.stringify({ fullName: profile.fullName, phone: profile.phone, address: profile.address }),
    });
    setSaving(false);
    if (!res) return;
    if (res.ok) setProfileMsg("Профиль сохранён ✓");
    else { const d = await res.json(); setProfileMsg(d.message || "Ошибка сохранения"); }
  };

  const handleCancel = async (orderId) => {
    setCancelMsg("");
    const res = await authFetch(`${API}/api/orders/${orderId}/cancel`, { method: "PATCH" });
    if (!res) return;
    const data = await res.json();
    if (res.ok) {
      setCancelMsg("Заказ отменён, остаток возвращён на склад.");
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "CANCELLED" } : o));
    } else {
      setCancelMsg(data.message || "Не удалось отменить заказ.");
    }
  };

  if (!currentUser) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Вы не авторизованы</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Войдите в аккаунт для доступа к личному кабинету</p>
        <Link to="/login" className="btn-hero-primary">Войти</Link>
      </div>
    );
  }

  const initials = profile.fullName
    ? profile.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="account-layout">
      {/* Sidebar */}
      <div className="account-sidebar">
        <div className="account-avatar">{initials}</div>
        <div className="account-name">{profile.fullName || "—"}</div>
        <div className="account-email">{profile.email}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            onClick={() => setActiveTab("profile")}
            style={{
              padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: activeTab === "profile" ? "var(--primary)" : "transparent",
              color: activeTab === "profile" ? "white" : "var(--text)",
              fontWeight: 600, fontSize: 14, textAlign: "left",
            }}
          >
            👤 Профиль
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            style={{
              padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: activeTab === "orders" ? "var(--primary)" : "transparent",
              color: activeTab === "orders" ? "white" : "var(--text)",
              fontWeight: 600, fontSize: 14, textAlign: "left",
            }}
          >
            📦 Мои заказы
            {orders.length > 0 && (
              <span style={{
                marginLeft: 8, background: "var(--accent)", color: "white",
                borderRadius: 20, padding: "2px 8px", fontSize: 12,
              }}>
                {orders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="account-orders-panel">
        {activeTab === "profile" && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Личные данные</h2>
            <form className="order-form" onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">ФИО</label>
                <input type="text" name="fullName" placeholder="Иванов Иван Иванович" value={profile.fullName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Email (не изменяется)</label>
                <input type="email" value={profile.email} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Телефон</label>
                <input type="tel" name="phone" placeholder="+7 (999) 000-00-00" value={profile.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Адрес доставки</label>
                <input type="text" name="address" placeholder="г. Кызыл, ул. Ленина, д. 1, кв. 10" value={profile.address} onChange={handleChange} />
              </div>
              <button type="submit" className="buy-button" style={{ maxWidth: 200 }} disabled={saving}>
                {saving ? "Сохраняем..." : "Сохранить"}
              </button>
            </form>
            {profileMsg && <p className="order-message" style={{ maxWidth: 480 }}>{profileMsg}</p>}
          </>
        )}

        {activeTab === "orders" && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Мои заказы</h2>
            {cancelMsg && <p className="order-message">{cancelMsg}</p>}

            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>📦</div>
                <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>У вас пока нет заказов</p>
                <Link to="/catalog" className="btn-hero-primary">Перейти в каталог</Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div>
                      <div className="order-card-id">Заказ #{order.id}</div>
                      <div className="order-card-date">
                        {new Date(order.createdAt).toLocaleString("ru-RU")}
                      </div>
                    </div>
                    <span className={`status-badge status-${order.status}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  <div className="order-items-list">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        {item.product?.name} — {item.quantity} шт. × {item.price.toLocaleString("ru-RU")} ₽
                      </div>
                    ))}
                  </div>

                  <div className="order-card-footer">
                    <span className="order-total">{order.totalPrice.toLocaleString("ru-RU")} ₽</span>
                    {["NEW", "PROCESSING"].includes(order.status) && (
                      <button className="secondary-button" onClick={() => handleCancel(order.id)}>
                        Отменить заказ
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AccountPage;
