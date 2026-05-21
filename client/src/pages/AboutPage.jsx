import { Link } from "react-router-dom";

const CARDS = [
  {
    icon: "🏔️",
    title: "Наша миссия",
    text: "Поддержка национального спорта Тывы через доступность качественного снаряжения для спортсменов всех уровней.",
  },
  {
    icon: "✅",
    title: "Качество товаров",
    text: "Только проверенные товары от мастеров республики. Каждый товар проходит контроль качества перед добавлением в каталог.",
  },
  {
    icon: "🚚",
    title: "Доставка",
    text: "Доставляем по всей России. Сроки и стоимость рассчитываются индивидуально при оформлении заказа.",
  },
  {
    icon: "📞",
    title: "Поддержка",
    text: "Консультации на русском и тувинском языках. Ответим на любые вопросы о товарах и заказах.",
  },
];

function AboutPage() {
  return (
    <div>
      {/* Шапка */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1b2e 0%, #2d3561 55%, #1e3a5f 100%)",
          borderRadius: "var(--r-xl)",
          padding: "52px 48px",
          marginBottom: 32,
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(200,149,42,.08)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--accent)",
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          О нас
        </div>
        <h1
          style={{
            fontSize: "clamp(22px, 3vw, 36px)",
            fontWeight: 800,
            marginBottom: 16,
            lineHeight: 1.2,
          }}
        >
          Tyva Sport Shop
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,.7)",
            fontSize: 16,
            maxWidth: 540,
            lineHeight: 1.75,
            margin: 0,
          }}
        >
          Специализированный интернет-магазин товаров для национальных видов спорта
          Республики Тыва. Хуреш, стрельба из лука, конные состязания — мы сохраняем
          и развиваем традиции тувинского спорта.
        </p>
      </div>

      {/* Карточки */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
          marginBottom: 32,
        }}
      >
        {CARDS.map((card) => (
          <div
            key={card.title}
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: "24px 22px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 8,
                color: "var(--text)",
              }}
            >
              {card.title}
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {card.text}
            </p>
          </div>
        ))}
      </div>

      {/* Контакты */}
      <div
        className="content-box"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Контакты
          </h2>
          <p style={{ color: "var(--text-muted)", margin: "0 0 4px", fontSize: 14 }}>
            Email:{" "}
            <strong style={{ color: "var(--text)" }}>admin@tyvashop.ru</strong>
          </p>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: 14 }}>
            Адрес:{" "}
            <strong style={{ color: "var(--text)" }}>
              Республика Тыва, г. Кызыл
            </strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/catalog" className="btn btn-primary">
            Перейти в каталог
          </Link>
          <Link to="/terms" className="btn btn-ghost">
            Соглашение
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
