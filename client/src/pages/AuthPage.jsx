import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const inputStyle = {
  backgroundColor: '#1c1408',
  color: '#faf8f3',
  WebkitTextFillColor: '#faf8f3',
  WebkitBoxShadow: '0 0 0 9999px #1c1408 inset',
  boxShadow: '0 0 0 9999px #1c1408 inset',
};

// Индикатор силы пароля
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["", "Слабый", "Средний", "Надёжный"];
  const colors = ["", "#c0392b", "#c8952a", "#166534"];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= score ? colors[score] : "var(--border)",
              transition: "background .3s",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: colors[score] || "var(--text-muted)" }}>
          {score > 0 ? labels[score] : ""}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { ok: checks.length, label: "8+ символов" },
            { ok: checks.upper, label: "Заглавная" },
            { ok: checks.digit, label: "Цифра" },
          ].map(({ ok, label }) => (
            <span key={label} style={{ fontSize: 11, color: ok ? "#166534" : "var(--text-muted)" }}>
              {ok ? "✓" : "○"} {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Поле пароля с глазком
function PasswordInput({ value, onChange, placeholder, id }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        className="form-input"
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ ...inputStyle, paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          position: "absolute", right: 12, top: "50%",
          transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", fontSize: 16, padding: 4, lineHeight: 1,
        }}
        title={show ? "Скрыть пароль" : "Показать пароль"}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultTab = location.state?.tab || (location.pathname === "/register" ? "register" : "login");

  const [tab, setTab] = useState(defaultTab);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ fullName: "", email: "", password: "" });
  const [agreed, setAgreed] = useState(false);

  const switchTab = (t) => { setTab(t); setMsg({ text: "", type: "" }); };

  // ── Вход ──────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    if (!loginForm.email || !loginForm.password) {
      setMsg({ text: "Заполните все поля", type: "error" }); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.needsVerification) {
        navigate("/verify-email", { state: { email: loginForm.email } }); return;
      }
      if (data.requires2FA) {
        navigate("/verify-2fa", { state: { email: loginForm.email } }); return;
      }
      if (!res.ok) { setMsg({ text: data.message, type: "error" }); return; }
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      navigate("/");
      window.location.reload();
    } catch { setMsg({ text: "Ошибка сервера", type: "error" }); }
    finally { setLoading(false); }
  };

  // ── Регистрация ───────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    if (!regForm.fullName || !regForm.email || !regForm.password) {
      setMsg({ text: "Заполните все поля", type: "error" }); return;
    }
    if (regForm.password.length < 8) {
      setMsg({ text: "Пароль минимум 8 символов", type: "error" }); return;
    }
    if (!/[A-Z]/.test(regForm.password)) {
      setMsg({ text: "Пароль должен содержать заглавную букву", type: "error" }); return;
    }
    if (!/[0-9]/.test(regForm.password)) {
      setMsg({ text: "Пароль должен содержать цифру", type: "error" }); return;
    }
    if (!agreed) {
      setMsg({ text: "Необходимо согласие на обработку персональных данных", type: "error" }); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: regForm.fullName, email: regForm.email, password: regForm.password }),
      });
      const data = await res.json();
      if (data.needsVerification) {
        navigate("/verify-email", { state: { email: regForm.email } }); return;
      }
      if (!res.ok) { setMsg({ text: data.message, type: "error" }); return; }
      setMsg({ text: "Регистрация успешна!", type: "success" });
    } catch { setMsg({ text: "Ошибка сервера", type: "error" }); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ paddingTop: 40, paddingBottom: 40 }}>
      <div className="form-card">
        {/* Логотип */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏔️</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, letterSpacing: '.14em', color: '#e8b84b' }}>
            TUVA <b style={{ color: '#faf8f3', fontWeight: 600 }}>SPORT</b>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.3em', color: '#9e9183', textTransform: 'uppercase', marginTop: 3 }}>
            тыва · спорт
          </div>
        </div>

        {/* Вкладки */}
        <div style={{
          display: "flex", background: "var(--bg-soft)",
          borderRadius: "var(--r-lg)", padding: 4, marginBottom: 28,
          border: "1px solid var(--border)",
        }}>
          {[{ id: "login", label: "Вход" }, { id: "register", label: "Регистрация" }].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              style={{
                flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                borderRadius: "var(--r-md)", fontSize: 14,
                fontWeight: tab === t.id ? 700 : 400,
                background: tab === t.id ? "var(--gold)" : "transparent",
                color: tab === t.id ? "var(--bg)" : "var(--stone)",
                boxShadow: "none",
                transition: "all .2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {msg.text && (
          <div className={`toast toast--${msg.type}`} style={{ marginBottom: 20 }}>
            {msg.text}
          </div>
        )}

        {/* ── Форма входа ── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                className="form-input"
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Пароль</label>
              <PasswordInput
                id="login-password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div style={{ textAlign: "right", marginTop: -6 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: "var(--accent-dark)" }}>
                Забыли пароль?
              </Link>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Вход..." : "Войти"}
            </button>
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Нет аккаунта?{" "}
              <button type="button" onClick={() => switchTab("register")}
                style={{ background: "none", border: "none", color: "var(--accent-dark)", cursor: "pointer", fontSize: 13, padding: 0, fontWeight: 600 }}>
                Зарегистрируйтесь
              </button>
            </p>
          </form>
        )}

        {/* ── Форма регистрации ── */}
        {tab === "register" && (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">ФИО</label>
              <input
                className="form-input"
                type="text"
                placeholder="Иванов Иван Иванович"
                value={regForm.fullName}
                onChange={(e) => setRegForm((p) => ({ ...p, fullName: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="your@email.com"
                value={regForm.email}
                onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <PasswordInput
                placeholder="Минимум 8 символов"
                value={regForm.password}
                onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
              />
              <PasswordStrength password={regForm.password} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, margin: '12px 0' }}>
              <div
                onClick={() => setAgreed(a => !a)}
                style={{
                  flexShrink: 0,
                  width: 18, height: 18,
                  marginTop: 2,
                  background: agreed ? 'var(--gold)' : 'transparent',
                  border: '1px solid var(--gold)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {agreed && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4L4 7.5L10 1" stroke="#1c1408" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.5, cursor: 'pointer' }} onClick={() => setAgreed(a => !a)}>
                Я принимаю{' '}
                <Link to="/terms" style={{ color: 'var(--gold-2)' }} onClick={e => e.stopPropagation()}>пользовательское соглашение</Link>
                {' '}и даю согласие на{' '}
                <Link to="/privacy" style={{ color: 'var(--gold-2)' }} onClick={e => e.stopPropagation()}>обработку персональных данных</Link>
              </span>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Регистрация..." : "Создать аккаунт"}
            </button>
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Уже есть аккаунт?{" "}
              <button type="button" onClick={() => switchTab("login")}
                style={{ background: "none", border: "none", color: "var(--accent-dark)", cursor: "pointer", fontSize: 13, padding: 0, fontWeight: 600 }}>
                Войти
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
