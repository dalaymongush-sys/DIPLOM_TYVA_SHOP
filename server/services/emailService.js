const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'onboarding@resend.dev';
const FROM_NAME = 'Tuva Sport Shop';

const sendVerificationEmail = async (email, name, code) => {
  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Подтверждение email — Tuva Sport Shop',
      html: `<h2>Привет, ${name}!</h2><p>Ваш код подтверждения: <strong>${code}</strong></p><p>Код действителен 15 минут.</p>`,
    });
  } catch (err) {
    console.error('Email error:', err.message);
    console.log(`DEV: verification code for ${email}: ${code}`);
  }
};

const sendWelcomeEmail = async (email, name) => {
  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Добро пожаловать в Tuva Sport Shop!',
      html: `<h2>Привет, ${name}!</h2><p>Ваш аккаунт успешно подтверждён. Добро пожаловать в Tuva Sport Shop!</p>`,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

const sendPasswordReset = async (email, name, code) => {
  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Восстановление пароля — Tuva Sport Shop',
      html: `<h2>Привет, ${name}!</h2><p>Ваш код восстановления пароля: <strong>${code}</strong></p><p>Код действителен 15 минут.</p>`,
    });
  } catch (err) {
    console.error('Email error:', err.message);
    console.log(`DEV: reset code for ${email}: ${code}`);
  }
};

const send2FACode = async (email, name, code) => {
  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Код двухфакторной аутентификации — Tuva Sport Shop',
      html: `<h2>Привет, ${name}!</h2><p>Ваш код входа: <strong>${code}</strong></p><p>Код действителен 10 минут.</p>`,
    });
  } catch (err) {
    console.error('Email error:', err.message);
    console.log(`DEV: 2FA code for ${email}: ${code}`);
  }
};

const sendOrderStatusUpdate = async (email, name, orderId, status, items, total) => {
  const statusLabels = {
    NEW: 'Новый',
    PROCESSING: 'В обработке',
    SHIPPED: 'Отправлен',
    DELIVERED: 'Доставлен',
    DONE: 'Завершён',
    CANCELLED: 'Отменён',
  };
  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Заказ #${orderId} — ${statusLabels[status] || status}`,
      html: `<h2>Привет, ${name}!</h2><p>Статус вашего заказа #${orderId} изменён на: <strong>${statusLabels[status] || status}</strong></p><p>Сумма: ${total} ₽</p>`,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordReset,
  send2FACode,
  sendOrderStatusUpdate,
};
