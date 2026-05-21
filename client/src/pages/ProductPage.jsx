import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { resolveImageUrl } from "../utils/api";
import ReviewSection, { StarRating } from "../components/ReviewSection";

const API = import.meta.env.VITE_API_URL;

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const [product, setProduct] = useState(null);
  const [reviewSummary, setReviewSummary] = useState({ avgRating: null, total: 0 });
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [msg, setMsg] = useState({ text: "", type: "" });

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {}
  const cartKey = currentUser ? `cart_${currentUser.id}` : "cart_guest";

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          fetch(`${API}/api/products/${id}`),
          fetch(`${API}/api/products/${id}/reviews`),
        ]);
        if (!pRes.ok) {
          navigate("/not-found", { replace: true });
          return;
        }
        setProduct(await pRes.json());
        const rData = await rRes.json();
        setReviewSummary({ avgRating: rData.avgRating, total: rData.total || 0 });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const addToCart = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (product.stock < quantity) {
      setMsg({ text: "Недостаточно товара на складе", type: "error" });
      return;
    }
    const savedCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const existing = savedCart.find((i) => i.id === product.id);
    const updatedCart = existing
      ? savedCart.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      : [...savedCart, { ...product, quantity }];

    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    refreshCart();
    setMsg({ text: `Добавлено в корзину: ${quantity} шт. ✓`, type: "success" });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="loading-spinner" />
        <span>Загрузка товара...</span>
      </div>
    );
  }
  if (!product) return null;

  const stockStatus =
    product.stock === 0
      ? { label: "Нет в наличии", color: "var(--red)" }
      : product.stock <= 3
      ? { label: `Осталось мало · ${product.stock} шт.`, color: "#b45309" }
      : { label: `В наличии · ${product.stock} шт.`, color: "var(--green)" };

  const imageUrl =
    resolveImageUrl(product.imageUrl) ||
    "https://via.placeholder.com/520x380?text=Нет+фото";

  return (
    <div>
      {/* Хлебные крошки */}
      <nav className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span>›</span>
        <Link to="/catalog">Каталог</Link>
        {product.category && (
          <>
            <span>›</span>
            <Link to={`/catalog?categoryId=${product.categoryId}`}>
              {product.category.name}
            </Link>
          </>
        )}
        <span>›</span>
        <span>{product.name}</span>
      </nav>

      {/* Основной блок */}
      <div className="product-grid">
        {/* Фото */}
        <div
          style={{
            borderRadius: "var(--r-xl)",
            overflow: "hidden",
            background: "var(--bg-soft)",
            border: "1px solid var(--border)",
            aspectRatio: "4/3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={imageUrl}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Информация */}
        <div>
          {product.category && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "var(--accent-dark)",
                marginBottom: 8,
              }}
            >
              {product.category.name}
            </div>
          )}

          <h1
            style={{
              fontSize: "clamp(20px, 3vw, 28px)",
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: 12,
              color: "var(--text)",
            }}
          >
            {product.name}
          </h1>

          {/* Рейтинг */}
          {reviewSummary.avgRating && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 18,
              }}
            >
              <StarRating
                value={Math.round(Number(reviewSummary.avgRating))}
                readonly
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#c8a96e",
                }}
              >
                {reviewSummary.avgRating}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                ({reviewSummary.total}{" "}
                {reviewSummary.total === 1
                  ? "отзыв"
                  : reviewSummary.total < 5
                  ? "отзыва"
                  : "отзывов"}
                )
              </span>
            </div>
          )}

          {/* Цена */}
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "var(--text)",
              marginBottom: 6,
              lineHeight: 1,
            }}
          >
            {product.price.toLocaleString("ru-RU")}{" "}
            <span
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: "var(--text-muted)",
              }}
            >
              ₽
            </span>
          </div>

          {/* Наличие */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: stockStatus.color,
              marginBottom: 24,
            }}
          >
            ● {stockStatus.label}
          </div>

          {/* Выбор количества */}
          {product.stock > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Количество:
              </span>
              <div className="qty-control">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Сообщение */}
          {msg.text && (
            <div className={`toast toast--${msg.type}`}>{msg.text}</div>
          )}

          {/* Кнопки */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={addToCart}
              disabled={product.stock === 0}
              style={{ flex: 1, minWidth: 200 }}
            >
              {product.stock === 0 ? "Нет в наличии" : "В корзину"}
            </button>
            <button
              className="btn btn-ghost btn-lg"
              onClick={() => navigate("/catalog")}
            >
              ← Назад
            </button>
          </div>

          {/* Описание */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 10,
                color: "var(--text)",
              }}
            >
              Описание
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                lineHeight: 1.8,
              }}
            >
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Секция отзывов */}
      <div
        style={{
          marginTop: 48,
          background: "var(--white)",
          borderRadius: "var(--r-xl)",
          padding: "36px 40px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <ReviewSection productId={Number(id)} />
      </div>
    </div>
  );
}

export default ProductPage;
