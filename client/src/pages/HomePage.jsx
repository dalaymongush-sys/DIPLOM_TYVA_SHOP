import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const CATEGORY_ICONS = {
  'Хуреш': '🤼',
  'Стрельба из лука': '🏹',
  'Конные состязания': '🐎',
  'Национальная атрибутика': '🎭',
  'Общие спортивные товары': '⚽',
};

const CAT_DESCS = {
  'Хуреш': 'Национальная борьба Тывы — снаряжение, пояса, форма',
  'Стрельба из лука': 'Луки, стрелы, мишени и аксессуары',
  'Конные состязания': 'Сёдла, упряжь, экипировка всадника',
  'Национальная атрибутика': 'Сувениры, украшения, традиционные изделия',
  'Общие спортивные товары': 'Универсальный инвентарь и экипировка',
};

const WHY = [
  {
    icon: '✓',
    title: 'Только проверенные товары',
    desc: 'Каждая партия проходит проверку у мастеров и спортсменов сборной Республики Тыва.',
  },
  {
    icon: '🚚',
    title: 'Доставка по Республике Тыва',
    desc: 'Кызыл — за день. Чадан, Ак-Довурак, Эрзин, Туран — за 2–3 дня. Бесплатно от 5 000 ₽.',
  },
  {
    icon: '🛡',
    title: 'Гарантия качества',
    desc: '14 дней на возврат без объяснений. На сёдла и луки — гарантия 2 года.',
  },
  {
    icon: '📞',
    title: 'Поддержка 24/7',
    desc: 'Менеджеры отвечают на тувинском и русском языках круглосуточно.',
  },
];

function HomePage() {
  const navigate = useNavigate();

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch {
    currentUser = null;
  }

  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [heroImage, setHeroImage] = useState(null);
  const [naadymSettings, setNaadymSettings] = useState({
    naadymTitle: 'НААДЫМ 2026',
    naadymSubtitle: 'Праздник трёх игр',
    naadymText: 'Национальный праздник Тывы — хуреш, стрельба из лука и конные скачки. Готовьтесь к соревнованиям с нашим снаряжением.',
    naadymPromoCode: null,
    naadymPromoText: null,
    naadymVisible: true,
  });

  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);

    fetch(`${API}/api/products?page=1&limit=4&sort=id_asc`)
      .then((r) => r.json())
      .then((data) => setFeatured(data.products || []))
      .catch(console.error);

    fetch(`${API}/api/settings/hero`)
      .then(r => r.json())
      .then(data => {
        if (data.imageUrl) setHeroImage(`${API}${data.imageUrl}`);
        setNaadymSettings({
          naadymTitle: data.naadymTitle || 'НААДЫМ 2026',
          naadymSubtitle: data.naadymSubtitle || 'Праздник трёх игр',
          naadymText: data.naadymText || '',
          naadymPromoCode: data.naadymPromoCode || null,
          naadymPromoText: data.naadymPromoText || null,
          naadymVisible: data.naadymVisible !== false,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="hero-grid" style={{
        margin: '0 -32px',
        background: 'linear-gradient(160deg, #1c1408 0%, #2d1e08 50%, #1c1408 100%)',
        borderBottom: '1px solid var(--line)',
        position: 'relative',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0,
        alignItems: 'stretch',
        minHeight: 600,
      }}>
        {/* Декоративные линии */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(200,149,42,.04) 0, rgba(200,149,42,.04) 1px, transparent 1px, transparent 80px)',
          pointerEvents: 'none',
        }} />

        {/* Левая часть — текст */}
        <div style={{ position: 'relative', padding: '80px 48px 80px 32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontSize: 11, letterSpacing: '0.18em', color: 'var(--gold)',
            fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
            marginBottom: 28,
          }}>
            <span style={{ display: 'inline-block', width: 28, height: 1, background: 'var(--gold)', opacity: 0.6 }} />
            Республика Тыва · Национальный спорт
            <span style={{ display: 'inline-block', width: 28, height: 1, background: 'var(--gold)', opacity: 0.6 }} />
          </div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(44px, 8vw, 80px)',
            fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.02em',
            color: 'var(--paper)', marginBottom: 4,
          }}>
            Tuva
          </h1>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(44px, 8vw, 80px)',
            fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em',
            color: 'var(--gold-2)', marginBottom: 28,
          }}>
            Sport Shop
          </h1>

          <p style={{
            fontSize: 16, color: 'var(--stone)', lineHeight: 1.7,
            maxWidth: 520, marginBottom: 16,
          }}>
            Всё для хуреш, стрельбы из лука, конных состязаний<br />
            и национальной атрибутики — в одном магазине
          </p>

          {/* Слоган — крупный и заметный */}
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(24px, 3vw, 38px)',
            color: 'var(--gold-2)',
            marginBottom: 40,
            lineHeight: 1.3,
            maxWidth: 520,
          }}>
            «Силу тела воспитывает степь, силу духа — традиция»
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/catalog" className="btn btn--gold btn--lg">
              Перейти в каталог
            </Link>
            {!currentUser ? (
              <Link to="/auth" className="btn btn--ghost btn--lg">
                Создать аккаунт
              </Link>
            ) : (
              <Link to="/account" className="btn btn--ghost btn--lg">
                Мои заказы
              </Link>
            )}
          </div>
        </div>

        {/* Правая часть — hero-фото (на всю высоту) */}
        <div className="hero-art" style={{ position: 'relative', minHeight: 520 }}>
          <div style={{
            position: 'absolute', inset: 0,
            border: '1px solid var(--gold)',
            borderTop: 'none', borderBottom: 'none', borderRight: 'none',
            background: `
              repeating-linear-gradient(135deg, rgba(232,184,75,.06) 0 2px, transparent 2px 22px),
              radial-gradient(circle at 50% 40%, rgba(232,184,75,.15), transparent 60%),
              var(--bg-2)
            `,
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
          }}>
            {heroImage ? (
              <img
                src={heroImage}
                alt="Hero"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <>
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
                  fontSize: 200, color: 'var(--gold-2)', opacity: .12, lineHeight: 1, userSelect: 'none',
                }}>Х</span>
                <span style={{
                  position: 'absolute', top: 18, left: 18,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  letterSpacing: '.22em', color: 'var(--gold)', textTransform: 'uppercase',
                }}>Хүреш · борец</span>
                <span style={{
                  position: 'absolute', left: 18, bottom: 14,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  letterSpacing: '.22em', color: 'var(--stone-dim)', textTransform: 'uppercase',
                }}>загрузите фото через админку</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── КАТЕГОРИИ ────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section style={{ margin: '64px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 500 }}>
              Категории
            </h2>
            <Link to="/catalog" style={{ fontSize: 13, color: 'var(--gold)', letterSpacing: '0.05em' }}>
              Все товары →
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/catalog?categoryId=${cat.id}`)}
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--line)',
                  padding: '24px 20px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color .2s, transform .2s',
                  color: 'var(--paper)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>{CATEGORY_ICONS[cat.name] || '🏆'}</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{cat.name}</div>
                <div style={{ fontSize: 12, color: 'var(--stone)', lineHeight: 1.5 }}>{CAT_DESCS[cat.name] || ''}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ─── НААДЫМ BANNER ────────────────────────────────────── */}
      {naadymSettings.naadymVisible && (
        <section style={{
          margin: '64px -32px 0',
          padding: '56px 32px',
          background: 'linear-gradient(135deg, #2d1e08 0%, #3d2a0e 50%, #2d1e08 100%)',
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{
              fontSize: 11, letterSpacing: '0.18em', color: 'var(--gold)',
              fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 16,
            }}>
              {naadymSettings.naadymSubtitle}
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 500, color: 'var(--gold-2)', letterSpacing: '0.06em', marginBottom: 16,
            }}>
              {naadymSettings.naadymTitle}
            </h2>
            {naadymSettings.naadymText && (
              <p style={{ fontSize: 15, color: 'var(--stone)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
                {naadymSettings.naadymText}
              </p>
            )}

            {naadymSettings.naadymPromoCode && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                border: '1px solid var(--gold)',
                background: 'rgba(200,149,42,.08)',
                marginBottom: 24,
              }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.18em', color: 'var(--stone)', textTransform: 'uppercase' }}>
                  Промокод:
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: 'var(--gold-2)', fontWeight: 700, letterSpacing: '.1em' }}>
                  {naadymSettings.naadymPromoCode}
                </span>
                {naadymSettings.naadymPromoText && (
                  <span style={{ fontSize: 13, color: 'var(--stone)' }}>
                    — {naadymSettings.naadymPromoText}
                  </span>
                )}
              </div>
            )}

            <div style={{ marginTop: naadymSettings.naadymPromoCode ? 4 : 28 }}>
              <Link to="/catalog" className="btn btn--gold btn--lg">Выбрать снаряжение</Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── ПОПУЛЯРНЫЕ ТОВАРЫ ────────────────────────────────── */}
      {featured.length > 0 && (
        <section style={{ margin: '64px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 500 }}>
              Популярные товары
            </h2>
            <Link to="/catalog" style={{ fontSize: 13, color: 'var(--gold)', letterSpacing: '0.05em' }}>
              Смотреть все →
            </Link>
          </div>
          <div className="products-grid">
            {featured.map((product) => (
              <div key={product.id} className="product-card">
                <img
                  src={product.imageUrl
                    ? product.imageUrl.startsWith('http')
                      ? product.imageUrl
                      : `${API}${product.imageUrl}`
                    : null
                  }
                  alt={product.name}
                  className="product-image"
                />
                <div style={{ padding: '4px 0' }}>
                  <Link to={`/product/${product.id}`} className="product-title-link">{product.name}</Link>
                  <p className="product-category-label">{product.category?.name}</p>
                  <p className="product-price">{product.price.toLocaleString('ru-RU')} ₽</p>
                  {product.stock > 0 ? (
                    <p className="product-stock-ok">В наличии: {product.stock} шт.</p>
                  ) : (
                    <p className="product-stock-empty">Нет в наличии</p>
                  )}
                  <Link to={`/product/${product.id}`} className="buy-button"
                    style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 10 }}>
                    Подробнее
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── ПОЧЕМУ МЫ ────────────────────────────────────────── */}
      <section style={{ margin: '64px 0 0' }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 500,
          textAlign: 'center', marginBottom: 40,
        }}>
          Почему Tuva Sport
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {WHY.map(({ icon, title, desc }) => (
            <div key={title} style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              padding: '28px 24px',
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--paper)' }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
