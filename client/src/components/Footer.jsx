import { Link } from 'react-router-dom';

function Footer() {

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        {/* Колонка 1 — Логотип */}
        <div>
          <Link to="/" className="logo" style={{ marginBottom: 12, display: 'inline-flex' }}>
            <div className="logo__mark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="12" cy="12" r="9.5"/>
                <circle cx="12" cy="12" r="2.5"/>
                <path d="M12 2.5v19M2.5 12h19M5.2 5.2l13.6 13.6M18.8 5.2L5.2 18.8"/>
              </svg>
            </div>
            <div className="logo__col">
              <span className="logo__name" style={{ fontSize: 13 }}>TUVA <b>SPORT</b></span>
              <span className="logo__tag" style={{ fontSize: 9 }}>с гор Саянских — с честью</span>
            </div>
          </Link>
          <p style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.6, marginTop: 8 }}>
            Национальная экипировка<br/>Республики Тыва
          </p>
        </div>

        {/* Колонка 2 — Магазин */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--gold)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 14, textTransform: 'uppercase' }}>
            Магазин
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/catalog" style={{ fontSize: 13, color: 'var(--stone)' }} className="footer-link">Каталог товаров</Link>
            <Link to="/catalog?category=wrestling" style={{ fontSize: 13, color: 'var(--stone)' }} className="footer-link">Хуреш</Link>
            <Link to="/catalog?category=archery" style={{ fontSize: 13, color: 'var(--stone)' }} className="footer-link">Стрельба из лука</Link>
            <Link to="/catalog?category=racing" style={{ fontSize: 13, color: 'var(--stone)' }} className="footer-link">Конные скачки</Link>
            <Link to="/wishlist" style={{ fontSize: 13, color: 'var(--stone)' }} className="footer-link">Избранное</Link>
          </div>
        </div>

        {/* Колонка 3 — Помощь */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--gold)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 14, textTransform: 'uppercase' }}>
            Помощь
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/about" style={{ fontSize: 13, color: 'var(--stone)' }} className="footer-link">О магазине</Link>
            <Link to="/delivery" style={{ fontSize: 13, color: 'var(--stone)' }} className="footer-link">Доставка и оплата</Link>
            <Link to="/account" style={{ fontSize: 13, color: 'var(--stone)' }} className="footer-link">Личный кабинет</Link>
            <Link to="/cart" style={{ fontSize: 13, color: 'var(--stone)' }} className="footer-link">Корзина</Link>
          </div>
        </div>

        {/* Колонка 4 — Правовое */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--gold)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 14, textTransform: 'uppercase' }}>
            Документы
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/privacy" style={{ fontSize: 13, color: 'var(--stone)' }} className="footer-link">Политика конфиденциальности</Link>
            <Link to="/terms" style={{ fontSize: 13, color: 'var(--stone)' }} className="footer-link">Пользовательское соглашение</Link>
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: 'var(--stone-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
            ИНН 1701000000<br/>
            г. Кызыл, Республика Тыва
          </div>
        </div>
      </div>

      {/* Нижняя полоса */}
      <div className="footer-bottom">
        <span>© 2026 · Кызыл · Республика Тыва</span>
        <span style={{ color: 'var(--stone-dim)', fontSize: 12 }}>Наадым — праздник трёх игр</span>
      </div>
    </footer>
  );
}

export default Footer;
