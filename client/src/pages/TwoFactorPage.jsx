import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function TwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) navigate("/auth");
  }, [email, navigate]);

  const handleCodeChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 5) document.getElementById(`tfa-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      document.getElementById(`tfa-${i - 1}`)?.focus();
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
      const res = await fetch(`${API}/api/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.message, type: "error" });
        return;
      }
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      navigate("/");
      window.location.reload();
    } catch {
      setMsg({ text: "Ошибка сервера", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
      <div
        style={{
          background: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          padding: "40px 36px",
          maxWidth: 440,
          width: "100%",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Двухфакторная аутентификация
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Код подтверждения отправлен на{" "}
            <strong style={{ color: "var(--text)" }}>{email}</strong>
          </p>
        </div>

        {msg.text && (
          <div className={`toast toast--${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{ display: "flex", gap: 10, justifyContent: "center", margin: "24px 0" }}
            onPaste={handlePaste}
          >
            {code.map((digit, i) => (
              <input
                key={i}
                id={`tfa-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: 48, height: 58, textAlign: "center",
                  fontSize: 22, fontWeight: 800,
                  border: "2px solid " + (digit ? "var(--accent)" : "var(--border)"),
                  borderRadius: "var(--r-md)", outline: "none",
                  background: digit ? "#fffbf0" : "var(--bg-soft)",
                  color: "var(--text)", transition: "all .15s",
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

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
          Код действует 10 минут
        </p>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          <Link to="/auth" style={{ color: "var(--text-muted)" }}>
            ← Вернуться ко входу
          </Link>
        </p>
      </div>
    </div>
  );
}

export default TwoFactorPage;
