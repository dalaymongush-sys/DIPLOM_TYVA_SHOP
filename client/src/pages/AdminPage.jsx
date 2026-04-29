import { useEffect, useState } from "react";

function AdminPage() {
  const token = localStorage.getItem("token");

  const emptyProductForm = {
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    stock: "",
    categoryId: "",
  };

  const emptyCategoryForm = {
    name: "",
  };

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [productMessage, setProductMessage] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");
  const [orderMessage, setOrderMessage] = useState("");

  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  const loadCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Ошибка загрузки категорий:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Ошибка загрузки товаров:", error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setOrderMessage(data.message || "Не удалось загрузить заказы.");
        return;
      }

      setOrders(data);
    } catch (error) {
      console.error("Ошибка загрузки заказов:", error);
      setOrderMessage("Ошибка сервера при загрузке заказов.");
    }
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadOrders();
  }, []);

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId(null);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductMessage("");

    if (
      !productForm.name ||
      !productForm.description ||
      !productForm.price ||
      !productForm.stock ||
      !productForm.categoryId
    ) {
      setProductMessage("Заполните все обязательные поля товара.");
      return;
    }

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      imageUrl: productForm.imageUrl,
      stock: Number(productForm.stock),
      categoryId: Number(productForm.categoryId),
    };

    try {
      let response;

      if (editingProductId) {
        response = await fetch(
          `http://localhost:5000/api/products/${editingProductId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch("http://localhost:5000/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        setProductMessage(data.message || "Операция с товаром не выполнена.");
        return;
      }

      setProductMessage(
        editingProductId ? "Товар успешно обновлён." : "Товар успешно добавлен."
      );
      resetProductForm();
      loadProducts();
    } catch (error) {
      console.error("Ошибка при сохранении товара:", error);
      setProductMessage("Ошибка сервера при сохранении товара.");
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryMessage("");

    if (!categoryForm.name) {
      setCategoryMessage("Введите название категории.");
      return;
    }

    try {
      let response;

      if (editingCategoryId) {
        response = await fetch(
          `http://localhost:5000/api/categories/${editingCategoryId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: categoryForm.name }),
          }
        );
      } else {
        response = await fetch("http://localhost:5000/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: categoryForm.name }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        setCategoryMessage(data.message || "Операция с категорией не выполнена.");
        return;
      }

      setCategoryMessage(
        editingCategoryId
          ? "Категория успешно обновлена."
          : "Категория успешно добавлена."
      );
      resetCategoryForm();
      loadCategories();
    } catch (error) {
      console.error("Ошибка при сохранении категории:", error);
      setCategoryMessage("Ошибка сервера при сохранении категории.");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      imageUrl: product.imageUrl || "",
      stock: product.stock || "",
      categoryId: product.categoryId || "",
    });
    setProductMessage("");
  };

  const handleDeleteProduct = async (id) => {
    const confirmed = window.confirm("Удалить товар?");
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setProductMessage(data.message || "Не удалось удалить товар.");
        return;
      }

      setProductMessage("Товар удалён.");
      if (editingProductId === id) {
        resetProductForm();
      }
      loadProducts();
    } catch (error) {
      console.error("Ошибка при удалении товара:", error);
      setProductMessage("Ошибка сервера при удалении товара.");
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name || "",
    });
    setCategoryMessage("");
  };

  const handleDeleteCategory = async (id) => {
    const confirmed = window.confirm("Удалить категорию?");
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setCategoryMessage(data.message || "Не удалось удалить категорию.");
        return;
      }

      setCategoryMessage("Категория удалена.");
      if (editingCategoryId === id) {
        resetCategoryForm();
      }
      loadCategories();
    } catch (error) {
      console.error("Ошибка при удалении категории:", error);
      setCategoryMessage("Ошибка сервера при удалении категории.");
    }
  };

  const handleStatusChange = async (orderId, status) => {
    setOrderMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setOrderMessage(data.message || "Не удалось обновить статус заказа.");
        return;
      }

      setOrderMessage("Статус заказа обновлён.");
      loadOrders();
    } catch (error) {
      console.error("Ошибка при обновлении статуса заказа:", error);
      setOrderMessage("Ошибка сервера при обновлении статуса.");
    }
  };

  return (
    <section className="content-box">
      <h1>Админ-панель</h1>

      <div className="admin-section">
        <h2>Управление категориями</h2>

        <form className="order-form" onSubmit={handleCategorySubmit}>
          <input
            type="text"
            name="name"
            placeholder="Название категории"
            value={categoryForm.name}
            onChange={handleCategoryChange}
          />

          <div className="admin-form-actions">
            <button type="submit" className="buy-button">
              {editingCategoryId ? "Сохранить категорию" : "Добавить категорию"}
            </button>

            {editingCategoryId && (
              <button
                type="button"
                className="secondary-button"
                onClick={resetCategoryForm}
              >
                Отмена
              </button>
            )}
          </div>
        </form>

        {categoryMessage && <p className="order-message">{categoryMessage}</p>}

        <div className="admin-product-list">
          {categories.map((category) => (
            <div key={category.id} className="admin-product-item">
              <div>
                <strong>{category.name}</strong>
                <div>Товаров в категории: {category._count?.products || 0}</div>
              </div>

              <div className="admin-product-actions">
                <button onClick={() => handleEditCategory(category)}>
                  Редактировать
                </button>
                <button onClick={() => handleDeleteCategory(category.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h2>{editingProductId ? "Редактирование товара" : "Добавление товара"}</h2>

        <form className="order-form" onSubmit={handleProductSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Название товара"
            value={productForm.name}
            onChange={handleProductChange}
          />

          <textarea
            name="description"
            placeholder="Описание товара"
            value={productForm.description}
            onChange={handleProductChange}
            className="admin-textarea"
          />

          <input
            type="number"
            name="price"
            placeholder="Цена"
            value={productForm.price}
            onChange={handleProductChange}
          />

          <input
            type="text"
            name="imageUrl"
            placeholder="Ссылка на изображение"
            value={productForm.imageUrl}
            onChange={handleProductChange}
          />

          <input
            type="number"
            name="stock"
            placeholder="Количество на складе"
            value={productForm.stock}
            onChange={handleProductChange}
          />

          <select
            name="categoryId"
            value={productForm.categoryId}
            onChange={handleProductChange}
            className="admin-select"
          >
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <div className="admin-form-actions">
            <button type="submit" className="buy-button">
              {editingProductId ? "Сохранить изменения" : "Добавить товар"}
            </button>

            {editingProductId && (
              <button
                type="button"
                className="secondary-button"
                onClick={resetProductForm}
              >
                Отмена
              </button>
            )}
          </div>
        </form>

        {productMessage && <p className="order-message">{productMessage}</p>}

        <div className="admin-products">
          <h2>Список товаров</h2>

          {products.length === 0 ? (
            <p>Товаров пока нет.</p>
          ) : (
            <div className="admin-product-list">
              {products.map((product) => (
                <div key={product.id} className="admin-product-item">
                  <div>
                    <strong>{product.name}</strong>
                    <div>Категория: {product.category?.name}</div>
                    <div>Цена: {product.price} ₽</div>
                    <div>Остаток: {product.stock}</div>
                  </div>

                  <div className="admin-product-actions">
                    <button onClick={() => handleEditProduct(product)}>
                      Редактировать
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="admin-section">
        <h2>Заказы</h2>

        {orderMessage && <p className="order-message">{orderMessage}</p>}

        {orders.length === 0 ? (
          <p>Заказов пока нет.</p>
        ) : (
          <div className="admin-product-list">
            {orders.map((order) => (
              <div key={order.id} className="admin-order-item">
                <div className="admin-order-main">
                  <strong>Заказ #{order.id}</strong>
                  <div>Покупатель: {order.user?.fullName}</div>
                  <div>Email: {order.user?.email}</div>
                  <div>Сумма: {order.totalPrice} ₽</div>
                  <div>Статус: {order.status}</div>
                  <div>Дата: {new Date(order.createdAt).toLocaleString()}</div>
                </div>

                <div className="admin-order-items">
                  <strong>Состав заказа:</strong>
                  {order.items.map((item) => (
                    <div key={item.id}>
                      {item.product?.name} — {item.quantity} шт. × {item.price} ₽
                    </div>
                  ))}
                </div>

                <div className="admin-order-actions">
                  <button onClick={() => handleStatusChange(order.id, "NEW")}>
                    NEW
                  </button>
                  <button onClick={() => handleStatusChange(order.id, "PROCESSING")}>
                    PROCESSING
                  </button>
                  <button onClick={() => handleStatusChange(order.id, "DONE")}>
                    DONE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminPage;