import { Link } from 'react-router-dom';

const CARDS = [
  {
    icon: '🏔️',
    title: 'Наша миссия',
    text: 'Поддержка национального спорта Тывы через доступность качественного снаряжения для спортсменов всех уровней.',
  },
  {
    icon: '✅',
    title: 'Качество товаров',
    text: 'Только проверенные товары от мастеров республики. Каждый товар проходит контроль качества перед добавлением в каталог.',
  },
  {
    icon: '🚚',
    title: 'Доставка по Тыве',
    text: 'Кызыл — за день. Чадан, Ак-Довурак, Эрзин, Туран — за 2–3 дня. Бесплатно от 5 000 ₽.',
  },
  {
    icon: '📞',
    title: 'Поддержка 24/7',
    text: 'Консультации на русском и тувинском языках. Отвечаем на любые вопросы о товарах и заказах круглосуточно.',
  },
];

function AboutPage() {
  return (
    <div>
      {/* Шапка */}
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--gold)',
        borderRadius: 0,
        padding: '48px',
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Декоративный фон */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(232,184,75,.1), transparent 60%),
            repeating-linear-gradient(135deg, rgba(232,184,75,.03) 0 2px, transparent 2px 18px)
          `,
          pointerEvents: 'none',
        }} />
        <div style={{
          fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--gold)', fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 16, position: 'relative',
        }}>
          О НАС
        </div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(36px, 5vw, 56px)',
          color: 'var(--paper)',
          margin: '0 0 16px',
          position: 'relative',
          fontWeight: 500,
        }}>
          Tuva Sport Shop
        </h1>
        <p style={{
          color: 'var(--stone)', fontSize: 15, maxWidth: 540,
          lineHeight: 1.7, margin: 0, position: 'relative',
        }}>
          Специализированный интернет-магазин товаров для национальных видов спорта
          Республики Тыва. Хуреш, стрельба из лука, конные состязания — мы сохраняем
          и развиваем традиции тувинского спорта.
        </p>
      </div>

      {/* Карточки */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 18,
        marginBottom: 32,
      }}>
        {CARDS.map((card) => (
          <div
            key={card.title}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              padding: '24px 22px',
              transition: 'border-color .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
          >
            <div style={{ fontSize: 30, marginBottom: 12 }}>{card.icon}</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20, fontWeight: 500,
              marginBottom: 8, color: 'var(--paper)',
            }}>
              {card.title}
            </div>
            <p style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.65, margin: 0 }}>
              {card.text}
            </p>
          </div>
        ))}
      </div>

      {/* Контакты */}
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        padding: '28px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 24, fontWeight: 500, marginBottom: 12,
          }}>
            Контакты
          </h2>
          <p style={{ color: 'var(--stone)', margin: '0 0 4px', fontSize: 14 }}>
            Email: <strong style={{ color: 'var(--paper)' }}>admin@tyvashop.ru</strong>
          </p>
          <p style={{ color: 'var(--stone)', margin: 0, fontSize: 14 }}>
            Адрес: <strong style={{ color: 'var(--paper)' }}>Республика Тыва, г. Кызыл</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/catalog" className="btn btn--gold">
            Перейти в каталог
          </Link>
          <Link to="/terms" className="btn btn--ghost">
            Соглашение
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
