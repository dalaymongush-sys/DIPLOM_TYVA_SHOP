import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Header() {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    localStorage.removeItem("currentUser");
    currentUser = null;
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="logo">
          Tyva Sport Shop
        </Link>

        <nav className="nav">
          <Link to="/">Главная</Link>
          <Link to="/catalog">Каталог</Link>
          <Link to="/cart">
            Корзина{cartCount > 0 && (
              <span style={{
                marginLeft: 4,
                background: "#c0392b",
                color: "white",
                borderRadius: "50%",
                padding: "2px 7px",
                fontSize: 11,
                fontWeight: 700,
              }}>
                {cartCount}
              </span>
            )}
          </Link>
          <Link to="/account">Личный кабинет</Link>

          {currentUser?.role === "ADMIN" && <Link to="/admin">Админка</Link>}

          {!currentUser ? (
            <>
              <Link to="/login">Вход</Link>
              <Link to="/register">Регистрация</Link>
            </>
          ) : (
            <>
              <span className="user-badge">
                {currentUser.fullName} ({currentUser.role})
              </span>
              <button className="header-logout" onClick={handleLogout}>
                Выйти
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
