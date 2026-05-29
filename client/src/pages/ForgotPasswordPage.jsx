import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

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
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? colors[score] : "var(--border)", transition: "background .3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: colors[score] || "var(--text-muted)" }}>
          {score > 0 ? labels[score] : ""}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          {[{ ok: checks.length, label: "8+ символов" }, { ok: checks.upper, label: "Заглавная" }, { ok: checks.digit, label: "Цифра" }].map(({ ok, label }) => (
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
function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        className="form-input"
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, padding: 4, lineHeight: 1 }}
        title={show ? "Скрыть пароль" : "Показать пароль"}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = email, 2 = code + new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  // ── Шаг 1: Отправка email ──────────────────────────────────
  const handleSendCode = async (e) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    if (!email) { setMsg({ text: "Введите email", type: "error" }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMsg({ text: data.message, type: "success" });
      setTimeout(() => { setMsg({ text: "", type: "" }); setStep(2); }, 1200);
    } catch {
      setMsg({ text: "Ошибка сервера", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ── Шаг 2: Ввод кода и нового пароля ──────────────────────
  const handleCodeChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 5) document.getElementById(`reset-code-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      document.getElementById(`reset-code-${i - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      e.preventDefault();
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    const fullCode = code.join("");
    if (fullCode.length < 6) { setMsg({ text: "Введите все 6 цифр кода", type: "error" }); return; }
    if (newPassword.length < 8) { setMsg({ text: "Пароль минимум 8 символов", type: "error" }); return; }
    if (!/[A-Z]/.test(newPassword)) { setMsg({ text: "Пароль должен содержать заглавную букву", type: "error" }); return; }
    if (!/[0-9]/.test(newPassword)) { setMsg({ text: "Пароль должен содержать цифру", type: "error" }); return; }
    if (newPassword !== confirmPassword) { setMsg({ text: "Пароли не совпадают", type: "error" }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ text: data.message, type: "error" }); return; }
      setMsg({ text: "Пароль успешно изменён! Войдите с новым паролем.", type: "success" });
      setTimeout(() => navigate("/auth"), 2000);
    } catch {
      setMsg({ text: "Ошибка сервера", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 40, paddingBottom: 40 }}>
      <div className="form-card">
        {/* Логотип */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{step === 1 ? "🔑" : "🔒"}</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            {step === 1 ? "Восстановление пароля" : "Новый пароль"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {step === 1
              ? "Введите email — отправим код для сброса пароля"
              : <>Код отправлен на <strong style={{ color: "var(--text)" }}>{email}</strong></>}
          </p>
        </div>

        {msg.text && (
          <div className={`toast toast--${msg.type}`} style={{ marginBottom: 20 }}>{msg.text}</div>
        )}

        {/* ── Шаг 1: email ── */}
        {step === 1 && (
          <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Отправка..." : "Отправить код"}
            </button>
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Вспомнили пароль?{" "}
              <Link to="/auth" style={{ color: "var(--accent-dark)", fontWeight: 600 }}>
                Войти
              </Link>
            </p>
          </form>
        )}

        {/* ── Шаг 2: код + новый пароль ── */}
        {step === 2 && (
          <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 6-значный код */}
            <div>
              <label className="form-label" style={{ marginBottom: 10 }}>Код из письма</label>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "center" }}
                onPaste={handlePaste}
              >
                {code.map((digit, i) => (
                  <input
                    key={i}
                    id={`reset-code-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    style={{
                      width: 46, height: 54, textAlign: "center", fontSize: 20, fontWeight: 800,
                      border: "2px solid " + (digit ? "var(--accent)" : "var(--border)"),
                      borderRadius: "var(--r-md)", outline: "none",
                      background: digit ? "#fffbf0" : "var(--bg-soft)",
                      color: "var(--text)", transition: "all .15s",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Новый пароль</label>
              <PasswordInput
                placeholder="Минимум 8 символов"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <PasswordStrength password={newPassword} />
            </div>

            <div className="form-group">
              <label className="form-label">Повторите пароль</label>
              <PasswordInput
                placeholder="Повторите новый пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <span style={{ fontSize: 12, color: "var(--red)", marginTop: 4 }}>Пароли не совпадают</span>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить новый пароль"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              <button
                type="button"
                onClick={() => { setStep(1); setCode(["","","","","",""]); setMsg({ text: "", type: "" }); }}
                style={{ background: "none", border: "none", color: "var(--accent-dark)", cursor: "pointer", fontSize: 13, padding: 0, fontWeight: 600 }}
              >
                ← Изменить email
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
