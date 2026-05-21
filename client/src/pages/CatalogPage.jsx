import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { resolveImageUrl } from "../utils/api";

const API = import.meta.env.VITE_API_URL;

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
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

  const debouncedSearch = useDebounce(search, 400);

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    localStorage.removeItem("currentUser");
    currentUser = null;
  }

  const cartKey = currentUser ? `cart_${currentUser.id}` : "cart_guest";

  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 12, sort });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedCategoryId !== "all") params.set("categoryId", selectedCategoryId);

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
  }, [debouncedSearch, selectedCategoryId, sort, page]);

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategoryId, sort]);

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
    setMessage(`Товар "${product.name}" добавлен в корзину.`);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategoryId("all");
    setSort("id_asc");
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

      {message && <p className="order-message">{message}</p>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
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
          </button>
        ))}
      </div>

      {loading ? (
        <p>Загрузка...</p>
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
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <img
                  src={resolveImageUrl(product.imageUrl) || "https://via.placeholder.com/300x180?text=Нет+фото"}
                  alt={product.name}
                  className="product-image"
                />
                <div style={{ padding: "4px 0", display: "flex", flexDirection: "column", flex: 1 }}>
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
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                  >
                    {product.stock > 0 ? "В корзину" : "Нет в наличии"}
                  </button>
                </div>
              </div>
            ))}
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
