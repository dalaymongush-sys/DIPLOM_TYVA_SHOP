import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function CatalogPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [message, setMessage] = useState("");

  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch (error) {
    localStorage.removeItem("currentUser");
    currentUser = null;
  }

  const cartKey = currentUser ? `cart_${currentUser.id}` : "cart_guest";

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesResponse = await fetch("http://localhost:5000/api/categories");
        const productsResponse = await fetch("http://localhost:5000/api/products");

        const categoriesData = await categoriesResponse.json();
        const productsData = await productsResponse.json();

        setCategories(categoriesData);
        setProducts(productsData);
      } catch (error) {
        console.error("Ошибка загрузки каталога:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addToCart = (product) => {
    if (!currentUser) {
      setMessage("Чтобы добавить товар в корзину, сначала войдите в аккаунт.");
      return;
    }

    const savedCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const existingItem = savedCart.find((item) => item.id === product.id);

    let updatedCart;

    if (existingItem) {
      updatedCart = savedCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...savedCart, { ...product, quantity: 1 }];
    }

    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    setMessage(`Товар "${product.name}" добавлен в корзину.`);
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategoryId === "all") {
      return products;
    }

    return products.filter(
      (product) => String(product.categoryId) === String(selectedCategoryId)
    );
  }, [products, selectedCategoryId]);

  if (loading) {
    return <h2>Загрузка каталога...</h2>;
  }

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

      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="product-image"
            />
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p><strong>Категория:</strong> {product.category?.name}</p>
            <p><strong>Цена:</strong> {product.price} ₽</p>
            <button className="buy-button" onClick={() => addToCart(product)}>
              В корзину
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CatalogPage;