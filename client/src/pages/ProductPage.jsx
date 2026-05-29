import { useEffect, useState, useCallback } from "react";
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
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [shared, setShared] = useState(false);

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
        const pData = await pRes.json();
        setProduct(pData);
        const rData = await rRes.json();
        setReviewSummary({ avgRating: rData.avgRating, total: rData.total || 0 });

        // Save to viewed history
        try {
          const historyKey = currentUser ? `viewed_${currentUser.id}` : "viewed_guest";
          const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
          const filtered = history.filter((p) => p.id !== pData.id);
          const compact = { id: pData.id, name: pData.name, price: pData.price, imageUrl: pData.imageUrl, categoryId: pData.categoryId };
          localStorage.setItem(historyKey, JSON.stringify([compact, ...filtered].slice(0, 20)));
        } catch {}
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    });
  };

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

  // Все фото товара — главное + дополнительные
  const allImages = [product.imageUrl, ...(product.images || [])]
    .filter(Boolean)
    .map(url => resolveImageUrl(url))
    .filter(Boolean);

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
        {/* Галерея */}
        <div style={{ display: "grid", gridTemplateColumns: allImages.length > 1 ? "80px 1fr" : "1fr", gap: 12 }}>
          {/* Миниатюры — только если фото больше одного */}
          {allImages.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 80, height: 80,
                    border: `1px solid ${i === activeImg ? "var(--gold)" : "var(--line)"}`,
                    cursor: "pointer",
                    overflow: "hidden",
                    background: "var(--bg-3)",
                    display: "grid", placeItems: "center",
                    transition: "border-color .15s",
                    flexShrink: 0,
                  }}
                >
                  <img src={img} alt={`фото ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}

          {/* Главное фото */}
          <div style={{
            position: "relative",
            border: "1px solid var(--gold)",
            background: "var(--bg-2)",
            display: "grid", placeItems: "center",
            overflow: "hidden",
            minHeight: 400,
          }}>
            {allImages.length > 0 ? (
              <img
                src={allImages[activeImg] ?? allImages[0]}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 120, color: "var(--gold-2)", opacity: .4 }}>🏺</span>
            )}

            {/* Стрелки */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg(i => (i - 1 + allImages.length) % allImages.length)}
                  style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(28,20,8,.75)", border: "1px solid var(--gold)",
                    color: "var(--gold-2)", cursor: "pointer", fontSize: 20,
                    display: "grid", placeItems: "center",
                  }}
                >‹</button>
                <button
                  onClick={() => setActiveImg(i => (i + 1) % allImages.length)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(28,20,8,.75)", border: "1px solid var(--gold)",
                    color: "var(--gold-2)", cursor: "pointer", fontSize: 20,
                    display: "grid", placeItems: "center",
                  }}
                >›</button>
                {/* Точки-индикаторы */}
                <div style={{
                  position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                  display: "flex", gap: 6,
                }}>
                  {allImages.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveImg(i)}
                      style={{
                        width: i === activeImg ? 20 : 6, height: 6, borderRadius: 3,
                        background: i === activeImg ? "var(--gold)" : "rgba(232,184,75,.3)",
                        cursor: "pointer", transition: "all .2s",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
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
            <button
              className="btn btn-ghost btn-lg"
              onClick={handleShare}
              title="Скопировать ссылку"
            >
              {shared ? "✓ Скопировано" : "🔗 Поделиться"}
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

      {/* Похожие товары */}
      {product.related && product.related.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: "var(--text)" }}>
            Похожие товары
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}>
            {product.related.map((rel) => {
              const relImg = resolveImageUrl(rel.imageUrl) || "https://via.placeholder.com/200x150?text=Нет+фото";
              return (
                <Link
                  key={rel.id}
                  to={`/product/${rel.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                  onClick={() => window.scrollTo(0, 0)}
                >
                  <div style={{
                    background: "var(--white)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-lg)",
                    overflow: "hidden",
                    transition: "box-shadow .2s",
                    cursor: "pointer",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                  >
                    <img
                      src={relImg}
                      alt={rel.name}
                      style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }}
                    />
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "var(--text)", lineHeight: 1.3 }}>
                        {rel.name}
                      </div>
                      {rel.avgRating && (
                        <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                          {[1,2,3,4,5].map((s) => (
                            <span key={s} style={{ fontSize: 10, color: s <= Math.round(Number(rel.avgRating)) ? "#f59e0b" : "#d1d5db" }}>★</span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                        {rel.price.toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductPage;
