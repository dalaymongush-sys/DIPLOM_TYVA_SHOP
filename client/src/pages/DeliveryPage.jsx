function DeliveryPage() {
  const sections = [
    {
      icon: "🚚",
      title: "Способы доставки",
      items: [
        {
          name: "Самовывоз — г. Кызыл",
          desc: "Бесплатно. Забрать заказ можно по адресу: г. Кызыл, Республика Тыва. Время выдачи уточняется при подтверждении заказа.",
        },
        {
          name: "Доставка по Республике Тыва",
          desc: "Доставляем в районные центры: Ак-Довурак, Туран, Шагонар, Чадан и другие населённые пункты. Срок: 1–3 рабочих дня.",
        },
        {
          name: "Почта России",
          desc: "Доставка по всей России. Срок: 7–21 рабочий день в зависимости от региона. Стоимость по тарифам Почты России.",
        },
        {
          name: "СДЭК",
          desc: "В пункты выдачи и курьером по городам с представительством СДЭК. Срок: 3–7 рабочих дней.",
        },
      ],
    },
    {
      icon: "📦",
      title: "Сроки обработки заказа",
      items: [
        {
          name: "Подтверждение",
          desc: "В течение 1 рабочего дня после оформления — менеджер свяжется с вами для уточнения деталей доставки.",
        },
        {
          name: "Комплектация",
          desc: "1–2 рабочих дня. Все товары проверяются перед отправкой.",
        },
        {
          name: "Передача в службу доставки",
          desc: "На следующий рабочий день после комплектации. Номер трека отправим на email.",
        },
      ],
    },
    {
      icon: "🔄",
      title: "Возврат и обмен",
      items: [
        {
          name: "Срок возврата",
          desc: "14 дней с момента получения товара надлежащего качества (ст. 26.1 Закона о защите прав потребителей).",
        },
        {
          name: "Условия возврата",
          desc: "Товар не должен быть в употреблении, сохранены оригинальная упаковка и ярлыки.",
        },
        {
          name: "Как оформить возврат",
          desc: "Напишите на admin@tyvashop.ru с темой «Возврат» и укажите номер заказа. Ответим в течение 1 рабочего дня.",
        },
      ],
    },
  ];

  return (
    <div>
      {/* Hero banner */}
      <div
        style={{
          background: 'linear-gradient(160deg, #2d1e08 0%, #3d2a0e 50%, #2d1e08 100%)',
          border: '1px solid var(--line)',
          borderRadius: "var(--r-xl)",
          padding: "40px 48px",
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontSize: 11, letterSpacing: 2, color: "var(--gold)",
            fontWeight: 600, textTransform: "uppercase",
            display: "block", marginBottom: 10,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Доставка по Республике Тыва и России
        </span>
        <h1
          style={{
            fontSize: "clamp(20px, 3vw, 32px)",
            fontWeight: 700,
            color: "var(--paper)",
            margin: 0,
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '0.02em',
          }}
        >
          Доставка и возврат
        </h1>
      </div>

      {/* Sections grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {sections.map((section) => (
          <div
            key={section.title}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              borderRadius: "var(--r-xl)",
              padding: 32,
              color: 'var(--paper)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{section.icon}</div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: 'var(--gold)' }}>
              {section.title}
            </h2>
            {section.items.map((item) => (
              <div
                key={item.name}
                style={{
                  marginBottom: 16,
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--paper)', marginBottom: 4 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.6 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Contact block */}
      <div
        style={{
          marginTop: 32,
          background: 'var(--bg-2)',
          borderRadius: "var(--r-xl)",
          padding: "28px 32px",
          border: '1px solid var(--line)',
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 10 }}>📞</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--paper)' }}>
          Остались вопросы?
        </h3>
        <p style={{ color: 'var(--stone)', fontSize: 14 }}>
          Напишите нам на{" "}
          <a href="mailto:admin@tyvashop.ru" style={{ color: 'var(--gold)', fontWeight: 600 }}>
            admin@tyvashop.ru
          </a>{" "}
          или позвоните — ответим в течение 1 рабочего дня.
        </p>
      </div>
    </div>
  );
}

export default DeliveryPage;
