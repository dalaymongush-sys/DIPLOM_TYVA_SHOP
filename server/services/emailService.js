const nodemailer = require("nodemailer");

// Если SMTP не настроен — используем console-transport (для разработки)
const isConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' ? true : false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : nodemailer.createTransport({ jsonTransport: true }); // dev-mode: не отправляет реально

const FROM = isConfigured
  ? `"Tuva Sport Shop" <${process.env.SMTP_USER}>`
  : '"Tuva Sport Shop" <noreply@tyvashop.ru>';

const devLog = (to, subject, text) => {
  console.log("\n" + "=".repeat(60));
  console.log(`📧 EMAIL (DEV MODE — SMTP не настроен)`);
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   ${text}`);
  console.log("=".repeat(60) + "\n");
};

// Отправка кода верификации
const sendVerificationCode = async (email, code) => {
  if (!isConfigured) {
    devLog(email, "Код верификации", `КОД: ${code}`);
    return;
  }
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Подтверждение регистрации — Tuva Sport Shop",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#faf8f3;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:24px;color:#1c1408;margin:0;">🏔️ Tuva Sport Shop</h1>
        </div>
        <h2 style="color:#1c1408;font-size:18px;">Подтвердите email</h2>
        <p style="color:#7a5c3a;font-size:15px;line-height:1.6;">
          Для завершения регистрации введите код подтверждения:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <span style="font-size:42px;font-weight:700;letter-spacing:12px;color:#c8952a;background:#f5e9c8;padding:16px 28px;border-radius:12px;display:inline-block;">
            ${code}
          </span>
        </div>
        <p style="color:#9e9183;font-size:13px;">Код действителен 15 минут. Если вы не регистрировались — просто проигнорируйте это письмо.</p>
      </div>
    `,
  });
};

// Уведомление о статусе заказа
const sendOrderStatusUpdate = async (email, fullName, orderId, status, items, totalPrice) => {
  const statusLabels = {
    NEW: "📦 Принят",
    PROCESSING: "⚙️ В обработке",
    SHIPPED: "🚚 Отправлен",
    DONE: "✅ Завершён",
    CANCELLED: "❌ Отменён",
  };
  const statusMessages = {
    NEW: "Ваш заказ принят и ожидает обработки.",
    PROCESSING: "Ваш заказ передан в обработку.",
    SHIPPED: "Ваш заказ отправлен. Ожидайте доставку.",
    DONE: "Ваш заказ завершён. Спасибо за покупку!",
    CANCELLED: "Ваш заказ отменён.",
  };

  if (!isConfigured) {
    devLog(email, `Заказ №${orderId} — ${statusLabels[status] || status}`,
      `Статус: ${status}, Сумма: ${totalPrice} ₽`);
    return;
  }

  const itemsHtml = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;color:#3a2910;">${i.product?.name || "Товар"}</td>` +
        `<td style="padding:8px 0;text-align:right;color:#3a2910;">${i.quantity} шт. × ${Number(i.price).toLocaleString("ru-RU")} ₽</td></tr>`
    )
    .join("");

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Заказ №${orderId} — ${statusLabels[status] || status}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#faf8f3;border-radius:16px;">
        <h1 style="font-size:20px;color:#1c1408;margin-bottom:4px;">🏔️ Tuva Sport Shop</h1>
        <p style="color:#9e9183;font-size:13px;margin-bottom:24px;">Уведомление о заказе</p>
        <div style="background:#f5e9c8;border-radius:12px;padding:20px;margin-bottom:24px;">
          <div style="font-size:22px;margin-bottom:4px;">${statusLabels[status] || status}</div>
          <p style="color:#3a2910;margin:0;font-size:15px;">${statusMessages[status] || ""}</p>
        </div>
        <h3 style="color:#1c1408;font-size:15px;margin-bottom:12px;">Заказ №${orderId}</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${itemsHtml}</table>
        <div style="border-top:2px solid #d4cdc3;padding-top:12px;text-align:right;">
          <strong style="font-size:16px;color:#1c1408;">Итого: ${Number(totalPrice).toLocaleString("ru-RU")} ₽</strong>
        </div>
        <p style="color:#9e9183;font-size:12px;margin-top:24px;">
          Здравствуйте, ${fullName}! По вопросам пишите на admin@tyvashop.ru
        </p>
      </div>
    `,
  });
};

// Письмо после успешной верификации
const sendWelcomeEmail = async (email, fullName) => {
  if (!isConfigured) {
    devLog(email, "Добро пожаловать!", `Пользователь ${fullName} верифицирован`);
    return;
  }
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Добро пожаловать в Tuva Sport Shop!",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#faf8f3;border-radius:16px;">
        <h1 style="color:#1c1408;">🏔️ Добро пожаловать, ${fullName}!</h1>
        <p style="color:#7a5c3a;font-size:15px;line-height:1.6;">
          Ваш аккаунт в Tuva Sport Shop успешно создан.<br>
          Теперь вы можете делать покупки в нашем магазине.
        </p>
      </div>
    `,
  });
};

// Сброс пароля
const sendResetCode = async (email, code) => {
  if (!isConfigured) {
    devLog(email, "Сброс пароля", `КОД: ${code}`);
    return;
  }
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Сброс пароля — Tuva Sport Shop",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#faf8f3;border-radius:16px;">
        <h1 style="font-size:20px;color:#1c1408;">🏔️ Tuva Sport Shop</h1>
        <h2 style="color:#1c1408;font-size:18px;">Сброс пароля</h2>
        <p style="color:#7a5c3a;font-size:15px;">Введите код для сброса пароля:</p>
        <div style="text-align:center;margin:28px 0;">
          <span style="font-size:42px;font-weight:700;letter-spacing:12px;color:#c8952a;background:#f5e9c8;padding:16px 28px;border-radius:12px;display:inline-block;">
            ${code}
          </span>
        </div>
        <p style="color:#9e9183;font-size:13px;">Код действителен 15 минут. Если вы не запрашивали сброс — проигнорируйте письмо.</p>
      </div>
    `,
  });
};

// Двухфакторная аутентификация
const sendTwoFactorCode = async (email, code) => {
  if (!isConfigured) {
    devLog(email, "Двухфакторная аутентификация", `КОД: ${code}`);
    return;
  }
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Код входа — Tuva Sport Shop",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#faf8f3;border-radius:16px;">
        <h1 style="font-size:20px;color:#1c1408;">🏔️ Tuva Sport Shop</h1>
        <h2 style="color:#1c1408;">Код подтверждения входа</h2>
        <div style="text-align:center;margin:28px 0;">
          <span style="font-size:42px;font-weight:700;letter-spacing:12px;color:#c8952a;background:#f5e9c8;padding:16px 28px;border-radius:12px;display:inline-block;">
            ${code}
          </span>
        </div>
        <p style="color:#9e9183;font-size:13px;">Код действителен 10 минут.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationCode, sendOrderStatusUpdate, sendWelcomeEmail, sendResetCode, sendTwoFactorCode };
