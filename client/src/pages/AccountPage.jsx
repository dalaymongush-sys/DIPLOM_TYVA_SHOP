import { useEffect, useState } from "react";

function AccountPage() {
  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch (error) {
    localStorage.removeItem("currentUser");
    currentUser = null;
  }

  const token = localStorage.getItem("token");
  const userId = currentUser?.id || "guest";
  const profileKey = `profile_${userId}`;

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem(profileKey) || "null");

    if (savedProfile) {
      setProfile(savedProfile);
    } else if (currentUser) {
      setProfile({
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        phone: "",
        address: "",
      });
    } else {
      setProfile({
        fullName: "",
        email: "",
        phone: "",
        address: "",
      });
    }
  }, [profileKey]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!token) {
        setOrders([]);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/orders/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setOrders([]);
          return;
        }

        setOrders(data);
      } catch (error) {
        console.error("Ошибка загрузки заказов:", error);
      }
    };

    loadOrders();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem(profileKey, JSON.stringify(profile));
    setMessage("Данные профиля сохранены");
  };

  return (
    <section className="content-box">
      <h1>Личный кабинет</h1>

      <form className="order-form" onSubmit={handleSave}>
        <input
          type="text"
          name="fullName"
          placeholder="ФИО"
          value={profile.fullName}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={profile.email}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Телефон"
          value={profile.phone}
          onChange={handleChange}
        />
        <input
          type="text"
          name="address"
          placeholder="Адрес доставки"
          value={profile.address}
          onChange={handleChange}
        />
        <button type="submit" className="buy-button">
          Сохранить профиль
        </button>
      </form>

      {message && <p className="order-message">{message}</p>}

      <div className="account-orders">
        <h2>Мои заказы</h2>

        {orders.length === 0 ? (
          <p>Заказов пока нет.</p>
        ) : (
          <div className="cart-list">
            {orders.map((order) => (
              <div key={order.id} className="cart-item">
                <div>
                  <strong>Заказ #{order.id}</strong>
                  <div>Товаров: {order.items.length}</div>
                  <div>Сумма: {order.totalPrice} ₽</div>
                  <div>Статус: {order.status}</div>
                  <div>Дата: {new Date(order.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AccountPage;