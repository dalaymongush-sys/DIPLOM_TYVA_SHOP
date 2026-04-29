import { Link, useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch (error) {
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
          <Link to="/cart">Корзина</Link>
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