import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function CartPage() {
  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch (error) {
    localStorage.removeItem("currentUser");
    currentUser = null;
  }

  const token = localStorage.getItem("token");
  const cartKey = currentUser ? `cart_${currentUser.id}` : "cart_guest";
  const profileKey = currentUser ? `profile_${currentUser.id}` : "profile_guest";

  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const savedProfile = JSON.parse(localStorage.getItem(profileKey) || "null");

    setCart(savedCart);
    setProfile(savedProfile);
  }, [cartKey, profileKey]);

  const updateCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
  };

  const addToCart = (product) => {
    const updatedCart = cart.map((item) =>
      item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
    );
    updateCart(updatedCart);
  };

  const decreaseQuantity = (productId) => {
    const updatedCart = cart
      .map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter((item) => item.quantity > 0);

    updateCart(updatedCart);
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    updateCart(updatedCart);
  };

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const handleCheckout = async () => {
    if (!currentUser || !token) {
      setMessage("Сначала войдите в аккаунт.");
      return;
    }

    if (cart.length === 0) {
      setMessage("Корзина пуста.");
      return;
    }

    if (
      !profile ||
      !profile.fullName ||
      !profile.email ||
      !profile.phone ||
      !profile.address
    ) {
      setMessage("Сначала заполните данные в личном кабинете.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: currentUser.id,
          items: cart,
          totalPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Не удалось оформить заказ.");
        return;
      }

      localStorage.removeItem(cartKey);
      setCart([]);
      setMessage("Заказ успешно оформлен.");
    } catch (error) {
      console.error("Ошибка оформления заказа:", error);
      setMessage("Ошибка сервера при оформлении заказа.");
    }
  };

  return (
    <section className="content-box">
      <h1>Корзина</h1>
      <p><strong>Товаров:</strong> {totalCount}</p>
      <p><strong>Сумма:</strong> {totalPrice} ₽</p>

      {cart.length === 0 ? (
        <p>Корзина пуста.</p>
      ) : (
        <div className="cart-list">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <div>
                <strong>{item.name}</strong>
                <div>{item.price} ₽ × {item.quantity}</div>
              </div>

              <div className="cart-actions">
                <button onClick={() => addToCart(item)}>+</button>
                <button onClick={() => decreaseQuantity(item.id)}>-</button>
                <button onClick={() => removeFromCart(item.id)}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cart-checkout">
        <h2>Подтверждение заказа</h2>

        {profile ? (
          <div className="profile-preview">
            <p><strong>ФИО:</strong> {profile.fullName || "не указано"}</p>
            <p><strong>Email:</strong> {profile.email || "не указано"}</p>
            <p><strong>Телефон:</strong> {profile.phone || "не указано"}</p>
            <p><strong>Адрес:</strong> {profile.address || "не указано"}</p>
          </div>
        ) : (
          <p>
            Данные профиля не заполнены. Перейдите в{" "}
            <Link to="/account">личный кабинет</Link>.
          </p>
        )}

        <button className="buy-button" onClick={handleCheckout}>
          Подтвердить заказ
        </button>

        {message && <p className="order-message">{message}</p>}
      </div>
    </section>
  );
}

export default CartPage;