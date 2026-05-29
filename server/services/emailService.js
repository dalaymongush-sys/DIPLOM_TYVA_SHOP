const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'noreply@tuvashop.ru';
const NAME = 'Tuva Sport Shop';

const emailBase = (content) => `
<div style="background:#1c1408;padding:40px 20px;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#2d1e08;border:1px solid #c8952a;border-radius:12px;overflow:hidden;">
    <div style="background:#c8952a;padding:20px 32px;text-align:center;">
      <h1 style="margin:0;color:#1c1408;font-size:20px;letter-spacing:0.05em;">🏔️ Tuva Sport Shop</h1>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="border-top:1px solid #3d2a0e;padding:16px 32px;text-align:center;">
      <p style="margin:0;color:#7a5c3a;font-size:12px;">© 2026 Tuva Sport Shop · tuvashop.ru</p>
    </div>
  </div>
</div>`;

const codeBlock = (code) => `
<div style="text-align:center;margin:28px 0;">
  <span style="font-size:40px;font-weight:700;letter-spacing:14px;color:#e8b84b;background:#1c1408;padding:16px 28px;border-radius:10px;border:1px solid #c8952a;display:inline-block;">
    ${code}
  </span>
</div>`;

const sendVerificationCode = async (email, code) => {
  try {
    await resend.emails.send({
      from: `${NAME} <${FROM}>`,
      to: email,
      subject: 'Код верификации — Tuva Sport Shop',
      html: emailBase(`
        <h2 style="color:#e8b84b;margin:0 0 16px;">Подтверждение email</h2>
        <p style="color:#faf8f3;font-size:15px;line-height:1.6;">Введите код для завершения регистрации:</p>
        ${codeBlock(code)}
        <p style="color:#7a5c3a;font-size:13px;">Код действителен 15 минут. Если вы не регистрировались — проигнорируйте письмо.</p>
      `),
    });
    console.log('Verification email sent to', email);
  } catch (err) {
    console.error('Resend error:', err.message);
    console.log('DEV code for', email, ':', code);
  }
};

const sendWelcomeEmail = async (email, fullName) => {
  try {
    await resend.emails.send({
      from: `${NAME} <${FROM}>`,
      to: email,
      subject: 'Добро пожаловать в Tuva Sport Shop!',
      html: emailBase(`
        <h2 style="color:#e8b84b;margin:0 0 16px;">Добро пожаловать, ${fullName}!</h2>
        <p style="color:#faf8f3;font-size:15px;line-height:1.6;">Ваш аккаунт успешно подтверждён. Теперь вы можете делать покупки в нашем магазине.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="https://www.tuvashop.ru" style="background:#c8952a;color:#1c1408;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Перейти в магазин</a>
        </div>
      `),
    });
  } catch (err) {
    console.error('Resend error:', err.message);
  }
};

const sendResetCode = async (email, code) => {
  try {
    await resend.emails.send({
      from: `${NAME} <${FROM}>`,
      to: email,
      subject: 'Сброс пароля — Tuva Sport Shop',
      html: emailBase(`
        <h2 style="color:#e8b84b;margin:0 0 16px;">Сброс пароля</h2>
        <p style="color:#faf8f3;font-size:15px;line-height:1.6;">Введите код для сброса пароля:</p>
        ${codeBlock(code)}
        <p style="color:#7a5c3a;font-size:13px;">Код действителен 15 минут. Если вы не запрашивали сброс — проигнорируйте письмо.</p>
      `),
    });
  } catch (err) {
    console.error('Resend error:', err.message);
    console.log('DEV reset for', email, ':', code);
  }
};

const sendTwoFactorCode = async (email, code) => {
  try {
    await resend.emails.send({
      from: `${NAME} <${FROM}>`,
      to: email,
      subject: 'Код входа — Tuva Sport Shop',
      html: emailBase(`
        <h2 style="color:#e8b84b;margin:0 0 16px;">Код двухфакторной аутентификации</h2>
        <p style="color:#faf8f3;font-size:15px;line-height:1.6;">Ваш код для входа в аккаунт:</p>
        ${codeBlock(code)}
        <p style="color:#7a5c3a;font-size:13px;">Код действителен 10 минут.</p>
      `),
    });
  } catch (err) {
    console.error('Resend error:', err.message);
    console.log('DEV 2FA for', email, ':', code);
  }
};

const sendOrderStatusUpdate = async (email, fullName, orderId, status, items, totalPrice) => {
  const labels = {
    NEW: 'Принят',
    PROCESSING: 'В обработке',
    SHIPPED: 'Отправлен',
    DELIVERED: 'Доставлен',
    DONE: 'Завершён',
    CANCELLED: 'Отменён',
  };
  try {
    await resend.emails.send({
      from: `${NAME} <${FROM}>`,
      to: email,
      subject: `Заказ №${orderId} — ${labels[status] || status}`,
      html: emailBase(`
        <h2 style="color:#e8b84b;margin:0 0 16px;">Обновление заказа №${orderId}</h2>
        <p style="color:#faf8f3;font-size:15px;">Привет, ${fullName}!</p>
        <div style="background:#1c1408;border:1px solid #c8952a;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
          <p style="color:#7a5c3a;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em;">Статус заказа</p>
          <p style="color:#e8b84b;font-size:22px;font-weight:700;margin:0;">${labels[status] || status}</p>
        </div>
        <p style="color:#faf8f3;font-size:15px;text-align:right;">Сумма: <strong style="color:#e8b84b;">${totalPrice} ₽</strong></p>
      `),
    });
  } catch (err) {
    console.error('Resend error:', err.message);
  }
};

module.exports = {
  sendVerificationCode,
  sendWelcomeEmail,
  sendResetCode,
  sendTwoFactorCode,
  sendOrderStatusUpdate,
};