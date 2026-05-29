import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch {
    localStorage.removeItem('currentUser');
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setMenuOpen(false);
    navigate('/');
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';
  const userInitial = currentUser?.fullName?.trim()[0]?.toUpperCase() || '?';

  return (
    <header className="site-header">
      <div className="site-header__inner">

        {/* Логотип */}
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <div className="logo__mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="12" cy="12" r="9.5"/>
              <circle cx="12" cy="12" r="2.5"/>
              <path d="M12 2.5v19M2.5 12h19M5.2 5.2l13.6 13.6M18.8 5.2L5.2 18.8"/>
            </svg>
          </div>
          <div className="logo__col">
            <span className="logo__name">TUVA <b>SPORT</b></span>
            <span className="logo__tag">тыва · спорт</span>
          </div>
        </Link>

        {/* Навигация — только десктоп */}
        <nav className="nav nav--desktop">
          <Link to="/" className={isActive('/')}>Главная</Link>
          <Link to="/catalog" className={isActive('/catalog')}>Каталог</Link>
          <Link to="/about" className={isActive('/about')}>О магазине</Link>
        </nav>

        {/* Правая часть — иконки всегда видны */}
        <div className="header-right">
          {/* Избранное */}
          <Link to="/wishlist" className="icon-btn" aria-label="Избранное">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10z"/>
            </svg>
          </Link>

          {/* Корзина */}
          <Link to="/cart" className="icon-btn" aria-label="Корзина" style={{ position: 'relative' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.6L21 8H6"/>
              <circle cx="9.5" cy="20.5" r="1.3"/>
              <circle cx="17.5" cy="20.5" r="1.3"/>
            </svg>
            {cartCount > 0 && (
              <span className="cart-count">{cartCount}</span>
            )}
          </Link>

          {/* Пользователь — только десктоп */}
          {currentUser ? (
            <div className="header-user-desktop">
              <Link to="/account" className="user-chip">
                <span className="user-chip__avatar">{userInitial}</span>
                <span className="user-chip__name">{currentUser.fullName.split(' ')[0]}</span>
              </Link>
              <button className="header-logout" onClick={handleLogout}>Выйти</button>
              {currentUser.role === 'ADMIN' && (
                <Link to="/admin" className="btn btn--sm" style={{ background: 'var(--gold)', color: 'var(--bg)', marginLeft: 4 }}>
                  Админ
                </Link>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn btn--ghost btn--sm header-login-desktop">Войти</Link>
          )}

          {/* Бургер — только мобильный */}
          <button
            className="burger-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Меню"
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {menuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            <Link to="/" className={isActive('/')} onClick={() => setMenuOpen(false)}>Главная</Link>
            <Link to="/catalog" className={isActive('/catalog')} onClick={() => setMenuOpen(false)}>Каталог</Link>
            <Link to="/about" className={isActive('/about')} onClick={() => setMenuOpen(false)}>О магазине</Link>
            <Link to="/delivery" onClick={() => setMenuOpen(false)}>Доставка</Link>
            <Link to="/wishlist" onClick={() => setMenuOpen(false)}>Избранное</Link>
          </nav>
          <div className="mobile-menu-footer">
            {currentUser ? (
              <>
                <Link to="/account" className="btn btn--gold btn--full" onClick={() => setMenuOpen(false)}>
                  Личный кабинет
                </Link>
                {currentUser.role === 'ADMIN' && (
                  <Link to="/admin" className="btn btn--dark btn--full" style={{ marginTop: 8 }} onClick={() => setMenuOpen(false)}>
                    Админ-панель
                  </Link>
                )}
                <button className="btn btn--dark btn--full" style={{ marginTop: 8 }} onClick={handleLogout}>
                  Выйти
                </button>
              </>
            ) : (
              <Link to="/auth" className="btn btn--gold btn--full" onClick={() => setMenuOpen(false)}>
                Войти / Зарегистрироваться
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
