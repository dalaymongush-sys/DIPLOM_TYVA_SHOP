import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { authFetch, resolveImageUrl } from "../utils/api";
import TUVA_LOCATIONS from "../data/tuvaLocations";

const API = import.meta.env.VITE_API_URL;

const STATUS_LABELS = {
  NEW: "Новый",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  DONE: "Выполнен",
  CANCELLED: "Отменён",
};

// ─── Order Tracker ─────────────────────────────────────────
const STAGES = ['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'DONE'];
const STAGE_LABELS = ['Новый', 'Обраб.', 'Отправл.', 'Доставл.', 'Завершён'];

function OrderTracker({ status }) {
  const currentIdx = STAGES.indexOf(status);
  if (currentIdx < 0) return null;
  const fillPct = currentIdx === 0 ? 0 : (currentIdx / (STAGES.length - 1)) * 100;

  return (
    <div className="order-tracker">
      <div className="tracker-line" />
      <div className="tracker-fill" style={{ width: `${fillPct}%` }} />
      <div className="tracker-steps">
        {STAGES.map((stage, i) => (
          <div
            key={stage}
            className={`tracker-step${i < currentIdx ? ' done' : ''}${i === currentIdx ? ' current' : ''}`}
          >
            <div className="dot">
              {i < currentIdx ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <div className="lbl">{STAGE_LABELS[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Поле пароля с глазком
function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ width: "100%", padding: "12px 44px 12px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg-soft)", color: "var(--text)" }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, padding: 4, lineHeight: 1 }}
        title={show ? "Скрыть" : "Показать"}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}

function OrderCard({ order, STATUS_LABELS, setCancelOrderId }) {
  return (
    <div className="order-card">
      <div className="order-card-header">
        <div>
          <div className="order-card-id">Заказ #{order.id}</div>
          <div className="order-card-date">
            {new Date(order.createdAt).toLocaleString("ru-RU")}
          </div>
        </div>
        <span className={`order-status ${order.status}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <OrderTracker status={order.status} />

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
          <button className="btn btn--ghost btn--sm" onClick={() => setCancelOrderId(order.id)}>
            Отменить заказ
          </button>
        )}
      </div>
    </div>
  );
}

function AccountPage() {
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    currentUser = null;
  }

  const [profile, setProfile] = useState({
    fullName: "", email: "", phone: "",
    city: "", street: "", house: "", apartment: "",
    avatarUrl: "",
  });
  const [orders, setOrders] = useState([]);
  const [profileMsg, setProfileMsg] = useState("");
  const [cancelMsg, setCancelMsg] = useState("");
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Password change
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwMsg, setPwMsg] = useState({ text: "", type: "" });
  const [pwSaving, setPwSaving] = useState(false);

  // Avatar
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarMsg, setAvatarMsg] = useState("");

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAMsg, setTwoFAMsg] = useState({ text: "", type: "" });

  // Viewed history
  const historyKey = currentUser ? `viewed_${currentUser.id}` : "viewed_guest";
  const [viewedHistory, setViewedHistory] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    authFetch(`${API}/api/auth/me`).then(async (res) => {
      if (res?.ok) {
        const d = await res.json();
        setProfile({
          fullName: d.fullName || "",
          email: d.email || "",
          phone: d.phone || "",
          city: d.city || "",
          street: d.street || "",
          house: d.house || "",
          apartment: d.apartment || "",
          avatarUrl: d.avatarUrl || "",
        });
        setTwoFAEnabled(!!d.twoFactorEnabled);
        if (d.avatarUrl) {
          setAvatarPreview(resolveImageUrl(d.avatarUrl) || "");
        }
      }
    });

    authFetch(`${API}/api/orders/my`).then(async (res) => {
      if (res?.ok) setOrders(await res.json());
    });

    try {
      const h = JSON.parse(localStorage.getItem(historyKey) || "[]");
      setViewedHistory(h);
    } catch {}
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
      body: JSON.stringify({
        fullName: profile.fullName,
        phone: profile.phone,
        city: profile.city,
        street: profile.street,
        house: profile.house,
        apartment: profile.apartment,
      }),
    });
    setSaving(false);
    if (!res) return;
    if (res.ok) setProfileMsg("Профиль сохранён ✓");
    else { const d = await res.json(); setProfileMsg(d.message || "Ошибка сохранения"); }
  };

  const handleCancelOrder = async (orderId) => {
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg({ text: "", type: "" });
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ text: "Новый пароль должен быть минимум 8 символов", type: "error" }); return;
    }
    if (!/[A-Z]/.test(pwForm.newPassword)) {
      setPwMsg({ text: "Новый пароль должен содержать заглавную букву", type: "error" }); return;
    }
    if (!/[0-9]/.test(pwForm.newPassword)) {
      setPwMsg({ text: "Новый пароль должен содержать цифру", type: "error" }); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ text: "Пароли не совпадают", type: "error" }); return;
    }
    setPwSaving(true);
    const res = await authFetch(`${API}/api/auth/change-password`, {
      method: "PATCH",
      body: JSON.stringify({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword }),
    });
    setPwSaving(false);
    if (!res) return;
    const data = await res.json();
    if (res.ok) {
      setPwMsg({ text: "Пароль успешно изменён ✓", type: "success" });
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPwMsg({ text: data.message || "Не удалось изменить пароль", type: "error" });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarMsg("");
    const fd = new FormData();
    fd.append("avatar", avatarFile);
    const res = await authFetch(`${API}/api/auth/avatar`, { method: "POST", body: fd });
    if (!res) return;
    const data = await res.json();
    if (res.ok) { setAvatarMsg("Аватар обновлён ✓"); setAvatarFile(null); }
    else { setAvatarMsg(data.message || "Ошибка загрузки"); }
  };

  const handleToggle2FA = async () => {
    setTwoFALoading(true);
    setTwoFAMsg({ text: "", type: "" });
    const res = await authFetch(`${API}/api/auth/toggle-2fa`, { method: "PATCH" });
    setTwoFALoading(false);
    if (!res) return;
    const data = await res.json();
    if (res.ok) {
      setTwoFAEnabled(data.twoFactorEnabled);
      setTwoFAMsg({
        text: data.twoFactorEnabled ? "Двухфакторная аутентификация включена ✓" : "Двухфакторная аутентификация отключена",
        type: data.twoFactorEnabled ? "success" : "warning",
      });
    } else {
      setTwoFAMsg({ text: data.message || "Ошибка", type: "error" });
    }
  };

  const COMPLETED_STATUSES = ['CANCELLED', 'DONE', 'DELIVERED'];
  const activeOrders = orders.filter(o => !COMPLETED_STATUSES.includes(o.status));
  const completedOrders = orders.filter(o => COMPLETED_STATUSES.includes(o.status));

  if (!currentUser) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Вы не авторизованы</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Войдите в аккаунт для доступа к личному кабинету</p>
        <Link to="/auth" className="btn-hero-primary">Войти</Link>
      </div>
    );
  }

  const initials = profile.fullName
    ? profile.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const tabStyle = (tab) => ({
    padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
    background: activeTab === tab ? "var(--primary)" : "transparent",
    color: activeTab === tab ? "white" : "var(--text)",
    fontWeight: 600, fontSize: 14, textAlign: "left",
  });

  return (
    <div className="account-layout">
      {/* Sidebar */}
      <div className="account-sidebar">
        <div style={{ position: "relative", marginBottom: 8 }}>
          {avatarPreview ? (
            <img src={resolveImageUrl(avatarPreview) || avatarPreview} alt="Аватар"
              style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--gold)" }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="account-avatar">{initials}</div>
          )}
        </div>
        <div className="account-name">{profile.fullName || "—"}</div>
        <div className="account-email">{profile.email}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button onClick={() => setActiveTab("profile")} style={tabStyle("profile")}>👤 Профиль</button>
          <button onClick={() => setActiveTab("security")} style={tabStyle("security")}>🔒 Безопасность</button>
          <button onClick={() => setActiveTab("orders")} style={tabStyle("orders")}>
            📦 Мои заказы
            {activeOrders.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, color: 'var(--stone)',
                marginLeft: 8,
              }}>
                {activeOrders.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab("history")} style={tabStyle("history")}>🕒 История</button>
        </div>
      </div>

      {/* Main content */}
      <div className="account-orders-panel">

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Личные данные</h2>
            <form className="order-form" onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">ФИО</label>
                <input type="text" name="fullName" placeholder="Иванов Иван Иванович"
                  value={profile.fullName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Email (не изменяется)</label>
                <input type="email" value={profile.email} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Телефон</label>
                <input type="tel" name="phone" placeholder="+7 (999) 000-00-00"
                  value={profile.phone} onChange={handleChange} />
              </div>

              {/* Адрес доставки — структурированный */}
              <div style={{
                background: "var(--bg-soft)", borderRadius: "var(--r-lg)",
                padding: "16px 18px", border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "var(--text)" }}>
                  📍 Адрес доставки
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Город / населённый пункт</label>
                    <select
                      name="city"
                      value={profile.city}
                      onChange={handleChange}
                      style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg-soft)", color: profile.city ? "var(--text)" : "var(--text-muted)" }}
                    >
                      <option value="">— Выберите населённый пункт —</option>
                      {TUVA_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Улица</label>
                      <input type="text" name="street" placeholder="ул. Ленина"
                        value={profile.street} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Дом</label>
                      <input type="text" name="house" placeholder="1"
                        value={profile.house} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Квартира / офис</label>
                    <input type="text" name="apartment" placeholder="10 (необязательно)"
                      value={profile.apartment} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <button type="submit" className="buy-button" style={{ maxWidth: 200 }} disabled={saving}>
                {saving ? "Сохраняем..." : "Сохранить"}
              </button>
            </form>
            {profileMsg && <p className="order-message" style={{ maxWidth: 480 }}>{profileMsg}</p>}
          </>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Безопасность</h2>

            {/* 2FA Toggle */}
            <div style={{
              background: "var(--bg-soft)", borderRadius: "var(--r-lg)",
              padding: "20px 24px", marginBottom: 20, border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>🛡️ Двухфакторная аутентификация</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 360 }}>
                    При входе в аккаунт на ваш email будет отправлен дополнительный код подтверждения.
                  </p>
                </div>
                <button
                  onClick={handleToggle2FA}
                  disabled={twoFALoading}
                  style={{
                    padding: "10px 20px", border: "none", borderRadius: 8, cursor: "pointer",
                    fontSize: 14, fontWeight: 600, flexShrink: 0,
                    background: twoFAEnabled ? "#dcfce7" : "var(--primary)",
                    color: twoFAEnabled ? "#166534" : "white",
                    transition: "all .2s",
                    opacity: twoFALoading ? 0.6 : 1,
                  }}
                >
                  {twoFALoading ? "..." : twoFAEnabled ? "✓ Включена" : "Включить"}
                </button>
              </div>
              {twoFAMsg.text && (
                <div className={`toast toast--${twoFAMsg.type}`} style={{ marginTop: 12 }}>
                  {twoFAMsg.text}
                </div>
              )}
            </div>

            {/* Avatar upload */}
            <div style={{
              background: "var(--bg-soft)", borderRadius: "var(--r-lg)",
              padding: "20px 24px", marginBottom: 20, border: "1px solid var(--border)",
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Фото профиля</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {avatarPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={avatarPreview} alt="Аватар"
                      style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await authFetch(`${API}/api/auth/avatar`, { method: 'DELETE' });
                        if (res?.ok) {
                          setAvatarPreview('');
                          setAvatarFile(null);
                          setAvatarMsg('Аватар удалён');
                        } else {
                          setAvatarMsg('Ошибка удаления аватара');
                        }
                      }}
                      style={{
                        position: 'absolute', top: -4, right: -4,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#c0392b', color: 'white',
                        border: 'none', cursor: 'pointer', fontSize: 13,
                        display: 'grid', placeItems: 'center', lineHeight: 1,
                      }}
                    >×</button>
                  </div>
                ) : (
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%", background: "var(--primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 800, fontSize: 22,
                  }}>
                    {initials}
                  </div>
                )}
                <div>
                  <label className="image-upload-label" style={{ marginBottom: 8, display: "block" }}>
                    <input type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange} style={{ display: "none" }} />
                    <span className="image-upload-btn">📷 Выбрать фото</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>JPG, PNG, WebP · до 5 МБ</span>
                  </label>
                  {avatarFile && (
                    <button className="buy-button" style={{ maxWidth: 160, padding: "8px 16px", fontSize: 13 }} onClick={handleAvatarUpload}>
                      Загрузить
                    </button>
                  )}
                </div>
              </div>
              {avatarMsg && <p className="order-message" style={{ marginTop: 8 }}>{avatarMsg}</p>}
            </div>

            {/* Password change */}
            <div style={{
              background: "var(--bg-soft)", borderRadius: "var(--r-lg)",
              padding: "20px 24px", border: "1px solid var(--border)",
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Изменить пароль</h3>
              <form className="order-form" onSubmit={handlePasswordChange} style={{ maxWidth: 360 }}>
                <div className="form-group">
                  <label className="form-label">Текущий пароль</label>
                  <PasswordInput
                    placeholder="Введите текущий пароль"
                    value={pwForm.oldPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, oldPassword: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Новый пароль</label>
                  <PasswordInput
                    placeholder="Минимум 8 символов"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                  />
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    Требования: 8+ символов, заглавная буква, цифра
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Повторите новый пароль</label>
                  <PasswordInput
                    placeholder="Повторите пароль"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  />
                </div>
                <button type="submit" className="buy-button" style={{ maxWidth: 200 }} disabled={pwSaving}>
                  {pwSaving ? "Сохраняем..." : "Изменить пароль"}
                </button>
              </form>
              {pwMsg.text && (
                <div className={`toast toast--${pwMsg.type}`} style={{ marginTop: 12, maxWidth: 360 }}>
                  {pwMsg.text}
                </div>
              )}
            </div>
          </>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, marginBottom: 24 }}>
              Мои заказы
            </h2>
            {cancelMsg && <p className="order-message">{cancelMsg}</p>}

            {activeOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", border: "1px dashed var(--line)" }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: .4 }}>📦</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--stone)", marginBottom: 8 }}>
                  Активных заказов нет
                </div>
                <p style={{ color: "var(--stone-dim)", fontSize: 13, marginBottom: 20 }}>
                  Завершённые и отменённые заказы хранятся в истории
                </p>
                <Link to="/catalog" className="btn btn--gold">Перейти в каталог</Link>
              </div>
            ) : (
              activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  STATUS_LABELS={STATUS_LABELS}
                  setCancelOrderId={setCancelOrderId}
                />
              ))
            )}

            {/* Завершённые / отменённые */}
            {completedOrders.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <button
                  onClick={() => setShowCompleted(s => !s)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11, letterSpacing: ".18em", color: "var(--stone)",
                    textTransform: "uppercase", background: "none", border: "none", cursor: "pointer",
                    marginBottom: 16,
                  }}
                >
                  {showCompleted ? "▲" : "▼"} Завершённые и отменённые ({completedOrders.length})
                </button>
                {showCompleted && completedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    STATUS_LABELS={STATUS_LABELS}
                    setCancelOrderId={setCancelOrderId}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Просмотренные товары</h2>
            {viewedHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🕒</div>
                <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>История просмотров пуста</p>
                <Link to="/catalog" className="btn-hero-primary">Перейти в каталог</Link>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  {viewedHistory.map((item) => {
                    const imgUrl = resolveImageUrl(item.imageUrl) || "https://via.placeholder.com/160x120?text=Нет+фото";
                    return (
                      <Link key={item.id} to={`/product/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <div
                          style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", transition: "box-shadow .2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
                          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                        >
                          <img src={imgUrl} alt={item.name}
                            style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
                          <div style={{ padding: "8px 10px" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3, marginBottom: 4, color: "var(--text)" }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
                              {item.price?.toLocaleString("ru-RU")} ₽
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <button
                  className="secondary-button"
                  style={{ marginTop: 20 }}
                  onClick={() => { localStorage.removeItem(historyKey); setViewedHistory([]); }}
                >
                  Очистить историю
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Модал подтверждения отмены заказа ── */}
      {cancelOrderId && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(8,5,2,.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) setCancelOrderId(null); }}
        >
          <div style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--gold)',
            padding: '32px 36px',
            maxWidth: 420, width: '100%',
            position: 'relative',
          }}>
            {/* Угловые акценты */}
            <div style={{ position: 'absolute', top: -1, left: -1, width: 18, height: 18, borderTop: '1px solid var(--gold)', borderLeft: '1px solid var(--gold)' }} />
            <div style={{ position: 'absolute', bottom: -1, right: -1, width: 18, height: 18, borderBottom: '1px solid var(--gold)', borderRight: '1px solid var(--gold)' }} />

            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 12, fontWeight: 500 }}>
              Отменить заказ?
            </h3>
            <p style={{ color: 'var(--stone)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Заказ #{cancelOrderId} будет отменён. Товары вернутся на склад.
              Это действие нельзя отменить.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn--dark" onClick={() => setCancelOrderId(null)}>
                Нет, оставить
              </button>
              <button
                className="btn btn--gold"
                style={{ background: 'var(--danger)', boxShadow: 'none' }}
                onClick={async () => {
                  await handleCancelOrder(cancelOrderId);
                  setCancelOrderId(null);
                }}
              >
                Да, отменить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountPage;
