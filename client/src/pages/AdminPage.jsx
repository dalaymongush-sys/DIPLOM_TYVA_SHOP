import { useEffect, useState } from "react";
import { authFetch } from "../utils/api";
import ConfirmDialog from "../components/ConfirmDialog";

const API = import.meta.env.VITE_API_URL;

function AdminPage() {
  const emptyProductForm = { name: "", description: "", price: "", imageUrl: "", stock: "", categoryId: "" };
  const emptyCategoryForm = { name: "" };

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

  const [confirm, setConfirm] = useState(null); // { message, onConfirm }

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API}/api/categories`);
      setCategories(await res.json());
    } catch (e) {
      console.error("Ошибка загрузки категорий:", e);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products?limit=1000`);
      const data = await res.json();
      setProducts(data.products || data);
    } catch (e) {
      console.error("Ошибка загрузки товаров:", e);
    }
  };

  const loadOrders = async () => {
    const res = await authFetch(`${API}/api/orders`);
    if (!res) return;
    const data = await res.json();
    if (res.ok) setOrders(data);
    else setOrderMessage(data.message || "Не удалось загрузить заказы.");
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadOrders();
  }, []);

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetProductForm = () => { setProductForm(emptyProductForm); setEditingProductId(null); };
  const resetCategoryForm = () => { setCategoryForm(emptyCategoryForm); setEditingCategoryId(null); };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductMessage("");
    if (!productForm.name || !productForm.description || !productForm.price || !productForm.categoryId) {
      setProductMessage("Заполните все обязательные поля товара.");
      return;
    }

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      imageUrl: productForm.imageUrl,
      stock: Number(productForm.stock) || 0,
      categoryId: Number(productForm.categoryId),
    };

    const url = editingProductId ? `${API}/api/products/${editingProductId}` : `${API}/api/products`;
    const method = editingProductId ? "PUT" : "POST";

    const res = await authFetch(url, { method, body: JSON.stringify(payload) });
    if (!res) return;
    const data = await res.json();

    if (!res.ok) { setProductMessage(data.message || "Операция не выполнена."); return; }
    setProductMessage(editingProductId ? "Товар успешно обновлён." : "Товар успешно добавлен.");
    resetProductForm();
    loadProducts();
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryMessage("");
    if (!categoryForm.name) { setCategoryMessage("Введите название категории."); return; }

    const url = editingCategoryId ? `${API}/api/categories/${editingCategoryId}` : `${API}/api/categories`;
    const method = editingCategoryId ? "PUT" : "POST";

    const res = await authFetch(url, { method, body: JSON.stringify({ name: categoryForm.name }) });
    if (!res) return;
    const data = await res.json();

    if (!res.ok) { setCategoryMessage(data.message || "Операция не выполнена."); return; }
    setCategoryMessage(editingCategoryId ? "Категория обновлена." : "Категория добавлена.");
    resetCategoryForm();
    loadCategories();
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

  const handleDeleteProduct = (id) => {
    setConfirm({
      message: "Удалить этот товар? Действие необратимо.",
      onConfirm: async () => {
        setConfirm(null);
        const res = await authFetch(`${API}/api/products/${id}`, { method: "DELETE" });
        if (!res) return;
        const data = await res.json();
        if (!res.ok) { setProductMessage(data.message || "Не удалось удалить товар."); return; }
        setProductMessage("Товар удалён.");
        if (editingProductId === id) resetProductForm();
        loadProducts();
      },
    });
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name || "" });
    setCategoryMessage("");
  };

  const handleDeleteCategory = (id) => {
    setConfirm({
      message: "Удалить эту категорию? Действие необратимо.",
      onConfirm: async () => {
        setConfirm(null);
        const res = await authFetch(`${API}/api/categories/${id}`, { method: "DELETE" });
        if (!res) return;
        const data = await res.json();
        if (!res.ok) { setCategoryMessage(data.message || "Не удалось удалить категорию."); return; }
        setCategoryMessage("Категория удалена.");
        if (editingCategoryId === id) resetCategoryForm();
        loadCategories();
      },
    });
  };

  const handleStatusChange = async (orderId, status) => {
    setOrderMessage("");
    const res = await authFetch(`${API}/api/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { setOrderMessage(data.message || "Не удалось обновить статус."); return; }
    setOrderMessage("Статус заказа обновлён.");
    loadOrders();
  };

  return (
    <section className="content-box">
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <h1>Админ-панель</h1>

      <div className="admin-section">
        <h2>Управление категориями</h2>
        <form className="order-form" onSubmit={handleCategorySubmit}>
          <input type="text" name="name" placeholder="Название категории" value={categoryForm.name} onChange={handleCategoryChange} />
          <div className="admin-form-actions">
            <button type="submit" className="buy-button">
              {editingCategoryId ? "Сохранить категорию" : "Добавить категорию"}
            </button>
            {editingCategoryId && (
              <button type="button" className="secondary-button" onClick={resetCategoryForm}>Отмена</button>
            )}
          </div>
        </form>
        {categoryMessage && <p className="order-message">{categoryMessage}</p>}
        <div className="admin-product-list">
          {categories.map((category) => (
            <div key={category.id} className="admin-product-item">
              <strong>{category.name}</strong>
              <div className="admin-product-actions">
                <button onClick={() => handleEditCategory(category)}>Редактировать</button>
                <button onClick={() => handleDeleteCategory(category.id)}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h2>{editingProductId ? "Редактирование товара" : "Добавление товара"}</h2>
        <form className="order-form" onSubmit={handleProductSubmit}>
          <input type="text" name="name" placeholder="Название товара" value={productForm.name} onChange={handleProductChange} />
          <textarea name="description" placeholder="Описание товара" value={productForm.description} onChange={handleProductChange} className="admin-textarea" />
          <input type="number" name="price" placeholder="Цена" value={productForm.price} onChange={handleProductChange} />
          <input type="text" name="imageUrl" placeholder="Ссылка на изображение" value={productForm.imageUrl} onChange={handleProductChange} />
          <input type="number" name="stock" placeholder="Количество на складе" value={productForm.stock} onChange={handleProductChange} />
          <select name="categoryId" value={productForm.categoryId} onChange={handleProductChange} className="admin-select">
            <option value="">Выберите категорию</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="admin-form-actions">
            <button type="submit" className="buy-button">
              {editingProductId ? "Сохранить изменения" : "Добавить товар"}
            </button>
            {editingProductId && (
              <button type="button" className="secondary-button" onClick={resetProductForm}>Отмена</button>
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
                    <button onClick={() => handleEditProduct(product)}>Редактировать</button>
                    <button onClick={() => handleDeleteProduct(product.id)}>Удалить</button>
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
                  <div>Дата: {new Date(order.createdAt).toLocaleString("ru-RU")}</div>
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
                  <button onClick={() => handleStatusChange(order.id, "NEW")}>NEW</button>
                  <button onClick={() => handleStatusChange(order.id, "PROCESSING")}>PROCESSING</button>
                  <button onClick={() => handleStatusChange(order.id, "DONE")}>DONE</button>
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
