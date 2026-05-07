import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const CATEGORY_ICONS = {
  "Хуреш": "🤼",
  "Стрельба из лука": "🏹",
  "Конные состязания": "🐎",
  "Национальная атрибутика": "🎭",
  "Общие спортивные товары": "⚽",
};

function HomePage() {
  const navigate = useNavigate();

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    currentUser = null;
  }

  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);

    fetch(`${API}/api/products?page=1&limit=4&sort=id_asc`)
      .then((r) => r.json())
      .then((data) => setFeatured(data.products || []))
      .catch(console.error);
  }, []);

  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <p className="hero-eyebrow">Республика Тыва · Национальный спорт</p>
        <h1 className="hero-title">Tyva Sport Shop</h1>
        <p className="hero-subtitle">
          Всё для хуреш, стрельбы из лука, конных состязаний<br />
          и национальной атрибутики — в одном магазине
        </p>
        <div className="hero-actions">
          <Link to="/catalog" className="btn-hero-primary">
            Перейти в каталог
          </Link>
          {!currentUser && (
            <Link to="/register" className="btn-hero-outline">
              Создать аккаунт
            </Link>
          )}
          {currentUser && (
            <Link to="/account" className="btn-hero-outline">
              Мои заказы
            </Link>
          )}
        </div>
      </div>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title">Категории</h2>
            <Link to="/catalog" className="section-link">Все товары →</Link>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="category-card"
                onClick={() => navigate(`/catalog?categoryId=${cat.id}`)}
              >
                <span className="category-icon">
                  {CATEGORY_ICONS[cat.name] || "🏆"}
                </span>
                <span className="category-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      {featured.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title">Популярные товары</h2>
            <Link to="/catalog" className="section-link">Смотреть все →</Link>
          </div>
          <div className="products-grid">
            {featured.map((product) => (
              <div key={product.id} className="product-card">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="product-image"
                />
                <div style={{ padding: "4px 0" }}>
                  <Link
                    to={`/product/${product.id}`}
                    className="product-title-link"
                  >
                    {product.name}
                  </Link>
                  <p className="product-category-label">{product.category?.name}</p>
                  <p className="product-price">{product.price.toLocaleString("ru-RU")} ₽</p>
                  {product.stock > 0 ? (
                    <p className="product-stock-ok">В наличии: {product.stock} шт.</p>
                  ) : (
                    <p className="product-stock-empty">Нет в наличии</p>
                  )}
                  <Link to={`/product/${product.id}`} className="buy-button" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 10 }}>
                    Подробнее
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* USP STRIP */}
      <section className="usp-strip">
        <div className="usp-item">
          <span className="usp-icon">🚚</span>
          <div>
            <strong>Доставка по России</strong>
            <p>Курьером или Почтой России</p>
          </div>
        </div>
        <div className="usp-item">
          <span className="usp-icon">✅</span>
          <div>
            <strong>Подлинные товары</strong>
            <p>Прямые поставки от производителей</p>
          </div>
        </div>
        <div className="usp-item">
          <span className="usp-icon">🔒</span>
          <div>
            <strong>Безопасная оплата</strong>
            <p>Ваши данные защищены</p>
          </div>
        </div>
        <div className="usp-item">
          <span className="usp-icon">📞</span>
          <div>
            <strong>Поддержка 7 дней</strong>
            <p>Ответим на любой вопрос</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
