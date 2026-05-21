import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!form.fullName || !form.email || !form.password) {
      setMessage({ text: "Заполните все поля.", type: "error" });
      return;
    }

    if (form.password.length < 6) {
      setMessage({ text: "Пароль должен содержать минимум 6 символов.", type: "error" });
      return;
    }

    if (!agreed) {
      setMessage({
        text: "Необходимо согласие на обработку персональных данных.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: form.fullName, email: form.email, password: form.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.message || "Не удалось зарегистрироваться.", type: "error" });
        return;
      }

      setMessage({ text: "Регистрация прошла успешно.", type: "success" });
      setTimeout(() => navigate("/login"), 700);
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      setMessage({ text: "Ошибка сервера при регистрации.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="content-box">
      <h1>Регистрация</h1>

      <form className="order-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="fullName"
          placeholder="ФИО"
          value={form.fullName}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль (минимум 6 символов)"
          value={form.password}
          onChange={handleChange}
        />

        <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            id="privacy"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <label htmlFor="privacy" style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Я принимаю{" "}
            <a href="/terms" target="_blank" style={{ color: "var(--accent-dark)" }}>
              пользовательское соглашение
            </a>{" "}
            и даю согласие на{" "}
            <a href="/privacy" target="_blank" style={{ color: "var(--accent-dark)" }}>
              обработку персональных данных
            </a>
          </label>
        </div>

        <button type="submit" className="buy-button" disabled={loading}>
          {loading ? "Загрузка..." : "Зарегистрироваться"}
        </button>
      </form>

      {message.text && <p className="order-message">{message.text}</p>}
    </section>
  );
}

export default RegisterPage;
