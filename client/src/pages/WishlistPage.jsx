import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch, resolveImageUrl } from "../utils/api";
import { useCart } from "../context/CartContext";

const API = import.meta.env.VITE_API_URL;

function WishlistPage() {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {}

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    authFetch(`${API}/api/wishlist`).then(async (res) => {
      if (res?.ok) setItems(await res.json());
      setLoading(false);
    });
  }, []);

  const removeFromWishlist = async (productId) => {
    const res = await authFetch(`${API}/api/wishlist/${productId}`, { method: "POST" });
    if (res?.ok) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    }
  };

  const addToCart = (product) => {
    const cartKey = `cart_${currentUser.id}`;
    const savedCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const existing = savedCart.find((i) => i.id === product.id);
    const updatedCart = existing
      ? savedCart.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...savedCart, { ...product, quantity: 1 }];
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    refreshCart();
    setMsg(`«${product.name}» добавлен в корзину`);
    setTimeout(() => setMsg(""), 3000);
  };

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="loading-spinner" />
        <span>Загрузка избранного...</span>
      </div>
    );
  }

  return (
    <section className="content-box">
      <h1>Избранное</h1>

      {msg && <div className="toast toast--success" style={{ marginTop: 12 }}>{msg}</div>}

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🤍</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Список избранного пуст</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
            Нажмите на сердечко на карточке товара, чтобы добавить его в избранное
          </p>
          <Link to="/catalog" className="btn btn-primary btn-lg">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
            {items.length} {items.length === 1 ? "товар" : items.length < 5 ? "товара" : "товаров"} в избранном
          </p>
          <div className="products-grid">
            {items.map(({ productId, product }) => {
              if (!product) return null;
              const imgUrl = resolveImageUrl(product.imageUrl) || "https://via.placeholder.com/300x180?text=Нет+фото";
              return (
                <div key={productId} className="product-card" style={{ position: "relative" }}>
                  {/* Remove from wishlist */}
                  <button
                    onClick={() => removeFromWishlist(productId)}
                    title="Убрать из избранного"
                    style={{
                      position: "absolute", top: 10, right: 10, zIndex: 2,
                      width: 32, height: 32, borderRadius: "50%",
                      background: "#fee2e2", border: "1px solid #fca5a5",
                      cursor: "pointer", fontSize: 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    ❤️
                  </button>

                  <img src={imgUrl} alt={product.name} className="product-image" />
                  <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <Link to={`/product/${product.id}`} className="product-title-link">
                      {product.name}
                    </Link>
                    <p className="product-category-label">{product.category?.name}</p>
                    <p className="product-price">{product.price.toLocaleString("ru-RU")} ₽</p>
                    {product.stock > 0 ? (
                      <p className="product-stock-ok">В наличии: {product.stock} шт.</p>
                    ) : (
                      <p className="product-stock-empty">Нет в наличии</p>
                    )}
                    <button
                      className="buy-button"
                      style={{ marginTop: "auto" }}
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                    >
                      {product.stock > 0 ? "В корзину" : "Нет в наличии"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default WishlistPage;
