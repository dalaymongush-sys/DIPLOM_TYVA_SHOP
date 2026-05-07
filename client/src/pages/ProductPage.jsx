import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const API = import.meta.env.VITE_API_URL;

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    currentUser = null;
  }

  const cartKey = currentUser ? `cart_${currentUser.id}` : "cart_guest";

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await fetch(`${API}/api/products/${id}`);
        if (!response.ok) {
          navigate("/not-found", { replace: true });
          return;
        }
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Ошибка загрузки товара:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, navigate]);

  const addToCart = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const savedCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const existingItem = savedCart.find((item) => item.id === product.id);

    const updatedCart = existingItem
      ? savedCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      : [...savedCart, { ...product, quantity: 1 }];

    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    refreshCart();
    setMessage(`Товар "${product.name}" добавлен в корзину.`);
  };

  if (loading) return <p style={{ padding: 24 }}>Загрузка товара...</p>;
  if (!product) return <p style={{ padding: 24 }}>Товар не найден.</p>;

  return (
    <section className="content-box">
      <button
        className="secondary-button"
        style={{ marginBottom: 24, marginTop: 0 }}
        onClick={() => navigate("/catalog")}
      >
        ← Назад в каталог
      </button>

      <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-image"
          style={{ width: 320, height: 220, objectFit: "cover", borderRadius: 8 }}
        />

        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ marginBottom: 8 }}>{product.name}</h1>
          <p style={{ color: "#666", marginBottom: 12 }}>
            <strong>Категория:</strong> {product.category?.name}
          </p>
          <p style={{ marginBottom: 16 }}>{product.description}</p>
          <p style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            {product.price} ₽
          </p>
          <p style={{ color: product.stock > 0 ? "#1f6b2a" : "#c0392b", marginBottom: 20 }}>
            {product.stock > 0 ? `В наличии: ${product.stock} шт.` : "Нет в наличии"}
          </p>

          {product.stock > 0 && (
            <button className="buy-button" onClick={addToCart}>
              В корзину
            </button>
          )}

          {message && <p className="order-message" style={{ marginTop: 12 }}>{message}</p>}
        </div>
      </div>
    </section>
  );
}

export default ProductPage;
