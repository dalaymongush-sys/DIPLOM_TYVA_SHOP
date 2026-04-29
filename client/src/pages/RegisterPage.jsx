import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.fullName || !form.email || !form.password) {
      setMessage("Заполните все поля.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Не удалось зарегистрироваться.");
        return;
      }

      setMessage("Регистрация прошла успешно.");

      setTimeout(() => {
        navigate("/login");
      }, 700);
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      setMessage("Ошибка сервера при регистрации.");
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
          placeholder="Пароль"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit" className="buy-button">
          Зарегистрироваться
        </button>
      </form>

      {message && <p className="order-message">{message}</p>}
    </section>
  );
}

export default RegisterPage;