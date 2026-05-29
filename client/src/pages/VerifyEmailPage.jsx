import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (!email) navigate("/auth");
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleCodeChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 5) document.getElementById(`code-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      document.getElementById(`code-${i - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setMsg({ text: "Введите все 6 цифр", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.message, type: "error" });
        return;
      }
      // Автовход после подтверждения email
      if (data.token && data.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        setMsg({ text: data.message, type: "success" });
        setTimeout(() => { navigate("/"); window.location.reload(); }, 1200);
      } else {
        setMsg({ text: data.message, type: "success" });
        setTimeout(() => navigate("/auth"), 1500);
      }
    } catch {
      setMsg({ text: "Ошибка сервера", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await fetch(`${API}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendTimer(60);
      setMsg({ text: "Новый код отправлен на email", type: "success" });
    } catch {
      setMsg({ text: "Ошибка отправки", type: "error" });
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
      <div
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-xl)",
          padding: "40px 36px",
          maxWidth: 440,
          width: "100%",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Подтвердите email
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Код отправлен на <strong style={{ color: "var(--text)" }}>{email}</strong>
          </p>
        </div>

        {msg.text && (
          <div className={`toast toast--${msg.type}`}>{msg.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              margin: "24px 0",
            }}
            onPaste={handlePaste}
          >
            {code.map((digit, i) => (
              <input
                key={i}
                id={`code-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: 48,
                  height: 58,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  border: "2px solid " + (digit ? "var(--gold)" : "var(--line)"),
                  borderRadius: "var(--r-md)",
                  outline: "none",
                  background: 'var(--bg-2)',
                  color: 'var(--paper)',
                  transition: "all .15s",
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Проверка..." : "Подтвердить"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--text-muted)",
            marginTop: 20,
          }}
        >
          {resendTimer > 0 ? (
            `Отправить повторно через ${resendTimer} сек.`
          ) : (
            <button
              onClick={handleResend}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-dark)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Отправить код повторно
            </button>
          )}
        </p>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--text-muted)",
            marginTop: 12,
          }}
        >
          <Link to="/auth" state={{ tab: "register" }} style={{ color: "var(--text-muted)" }}>
            ← Вернуться к регистрации
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
