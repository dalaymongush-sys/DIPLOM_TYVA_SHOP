import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { resolveImageUrl, authFetch } from "../utils/api";

const API = import.meta.env.VITE_API_URL;

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function StarMini({ avg }) {
  if (!avg) return null;
  const rounded = Math.round(Number(avg));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: 11, color: i <= rounded ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 2 }}>{avg}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="product-card" style={{ gap: 0 }}>
      <div className="skeleton" style={{ width: "100%", aspectRatio: "4/3", borderRadius: "var(--r-md) var(--r-md) 0 0" }} />
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div className="skeleton" style={{ height: 16, borderRadius: 6, width: "85%" }} />
        <div className="skeleton" style={{ height: 12, borderRadius: 6, width: "50%" }} />
        <div className="skeleton" style={{ height: 22, borderRadius: 6, width: "60%" }} />
        <div className="skeleton" style={{ height: 36, borderRadius: 8, marginTop: "auto" }} />
      </div>
    </div>
  );
}

function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshCart } = useCart();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get("categoryId") || "all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("id_asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(new Set());

  const debouncedSearch = useDebounce(search, 400);
  const debouncedMin = useDebounce(minPrice, 600);
  const debouncedMax = useDebounce(maxPrice, 600);

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    localStorage.removeItem("currentUser");
    currentUser = null;
  }

  const cartKey = currentUser ? `cart_${currentUser.id}` : "cart_guest";

  // Load categories
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  // Load wishlist for logged-in user
  useEffect(() => {
    if (!currentUser) return;
    authFetch(`${API}/api/wishlist`).then(async (res) => {
      if (res?.ok) {
        const data = await res.json();
        setWishlistIds(new Set(data.map((w) => w.productId)));
      }
    });
  }, []);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 12, sort });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedCategoryId !== "all") params.set("categoryId", selectedCategoryId);
        if (debouncedMin) params.set("minPrice", debouncedMin);
        if (debouncedMax) params.set("maxPrice", debouncedMax);

        const response = await fetch(`${API}/api/products?${params.toString()}`);
        const data = await response.json();
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("Ошибка загрузки товаров:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [debouncedSearch, selectedCategoryId, sort, page, debouncedMin, debouncedMax]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategoryId, sort, debouncedMin, debouncedMax]);

  const addToCart = (product) => {
    if (!currentUser) {
      setMessage("Чтобы добавить товар в корзину, сначала войдите в аккаунт.");
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
    setMessage(`«${product.name}» добавлен в корзину`);
    setTimeout(() => setMessage(""), 3000);
  };

  const toggleWishlist = async (productId) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setWishlistLoading((prev) => new Set(prev).add(productId));
    const res = await authFetch(`${API}/api/wishlist/${productId}`, { method: "POST" });
    setWishlistLoading((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    if (!res) return;
    const data = await res.json();
    if (res.ok) {
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (data.wishlisted) next.add(productId);
        else next.delete(productId);
        return next;
      });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategoryId("all");
    setSort("id_asc");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  return (
    <section className="content-box">
      <h1>Каталог товаров</h1>

      {!currentUser && (
        <div className="catalog-notice">
          <p>Для добавления товаров в корзину нужно войти в аккаунт.</p>
          <button className="buy-button" onClick={() => navigate("/login")}>
            Перейти ко входу
          </button>
        </div>
      )}

      {message && <div className="toast toast--success" style={{ marginBottom: 16 }}>{message}</div>}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="catalog-search-input"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="admin-select"
          style={{ maxWidth: 200 }}
        >
          <option value="id_asc">По умолчанию</option>
          <option value="price_asc">Сначала дешевле</option>
          <option value="price_desc">Сначала дороже</option>
          <option value="name_asc">По названию А-Я</option>
        </select>
      </div>

      {/* Price filter */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Цена:</span>
        <input
          type="number"
          placeholder="от ₽"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={{
            width: 90, padding: "7px 10px", border: "1px solid var(--border)",
            borderRadius: 8, fontSize: 13, background: "var(--bg-soft)"
          }}
        />
        <span style={{ color: "var(--text-muted)" }}>—</span>
        <input
          type="number"
          placeholder="до ₽"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{
            width: 90, padding: "7px 10px", border: "1px solid var(--border)",
            borderRadius: 8, fontSize: 13, background: "var(--bg-soft)"
          }}
        />
        {(minPrice || maxPrice) && (
          <button
            onClick={() => { setMinPrice(""); setMaxPrice(""); }}
            style={{
              fontSize: 12, color: "var(--text-muted)", background: "none",
              border: "none", cursor: "pointer", padding: "4px 8px"
            }}
          >
            ✕ сбросить
          </button>
        )}
      </div>

      {/* Category buttons */}
      <div className="category-buttons">
        <button
          className={selectedCategoryId === "all" ? "active" : ""}
          onClick={() => setSelectedCategoryId("all")}
        >
          Все товары
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={String(selectedCategoryId) === String(category.id) ? "active" : ""}
            onClick={() => setSelectedCategoryId(category.id)}
          >
            {category.name}
            {category._count?.products > 0 && (
              <span style={{ fontSize: 11, opacity: 0.65, marginLeft: 4 }}>
                ({category._count.products})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="products-grid">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ color: "#666", marginBottom: 16 }}>Товары не найдены по выбранным фильтрам</p>
          <button className="secondary-button" style={{ marginTop: 0 }} onClick={resetFilters}>
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map((product) => {
              const isWishlisted = wishlistIds.has(product.id);
              const wLoading = wishlistLoading.has(product.id);
              return (
                <div key={product.id} className="product-card" style={{ position: "relative" }}>
                  {/* Wishlist heart */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    disabled={wLoading}
                    title={isWishlisted ? "Убрать из избранного" : "Добавить в избранное"}
                    style={{
                      position: "absolute", top: 10, right: 10, zIndex: 2,
                      width: 32, height: 32, borderRadius: "50%",
                      background: isWishlisted ? "#fee2e2" : "rgba(255,255,255,0.9)",
                      border: isWishlisted ? "1px solid #fca5a5" : "1px solid var(--border)",
                      cursor: "pointer", fontSize: 16, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      transition: "all .15s", boxShadow: "0 1px 4px rgba(0,0,0,.1)",
                    }}
                  >
                    {isWishlisted ? "❤️" : "🤍"}
                  </button>

                  <img
                    src={resolveImageUrl(product.imageUrl) || "https://via.placeholder.com/300x180?text=Нет+фото"}
                    alt={product.name}
                    className="product-image"
                  />
                  <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <Link to={`/product/${product.id}`} className="product-title-link">
                      {product.name}
                    </Link>
                    <p className="product-category-label">{product.category?.name}</p>
                    <StarMini avg={product.avgRating} />
                    {product.reviewCount > 0 && (
                      <span style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                        {product.reviewCount} {product.reviewCount === 1 ? "отзыв" : product.reviewCount < 5 ? "отзыва" : "отзывов"}
                      </span>
                    )}
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

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 32, alignItems: "center" }}>
              <button
                className="secondary-button"
                style={{ marginTop: 0 }}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Назад
              </button>
              <span style={{ padding: "8px 16px", fontSize: 14, color: "#666" }}>
                {page} / {totalPages}
              </span>
              <button
                className="secondary-button"
                style={{ marginTop: 0 }}
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default CatalogPage;
