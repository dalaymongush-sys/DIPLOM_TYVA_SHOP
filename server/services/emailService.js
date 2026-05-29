const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'noreply@tuvashop.ru';
const NAME = 'Tuva Sport Shop';

const sendVerificationCode = async (email, code) => {
  try {
    await resend.emails.send({
      from: `${NAME} <${FROM}>`,
      to: email,
      subject: 'Код верификации — Tuva Sport Shop',
      html: `<h2>Ваш код подтверждения: <strong>${code}</strong></h2><p>Действителен 15 минут.</p>`,
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
      html: `<h2>Привет, ${fullName}! Ваш аккаунт подтверждён.</h2>`,
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
      html: `<h2>Код сброса пароля: <strong>${code}</strong></h2><p>Действителен 15 минут.</p>`,
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
      html: `<h2>Код двухфакторной аутентификации: <strong>${code}</strong></h2><p>Действителен 10 минут.</p>`,
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
      html: `<h2>Привет, ${fullName}!</h2><p>Статус заказа №${orderId}: <strong>${labels[status] || status}</strong></p><p>Сумма: ${totalPrice} ₽</p>`,
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