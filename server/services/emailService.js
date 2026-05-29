const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'onboarding@resend.dev';
const NAME = 'Tuva Sport Shop';

const sendVerificationCode = async (email, code) => {
  try {
    await resend.emails.send({ from: ${NAME} <>, to: email, subject: 'Код верификации — Tuva Sport Shop', html: <h2>Ваш код: <strong></strong></h2><p>Действителен 15 минут.</p> });
  } catch (err) { console.error('Resend:', err.message); console.log(DEV code for : ); }
};
const sendWelcomeEmail = async (email, fullName) => {
  try { await resend.emails.send({ from: ${NAME} <>, to: email, subject: 'Добро пожаловать!', html: <h2>Привет, ! Аккаунт подтверждён.</h2> }); } catch (err) { console.error('Resend:', err.message); }
};
const sendResetCode = async (email, code) => {
  try { await resend.emails.send({ from: ${NAME} <>, to: email, subject: 'Сброс пароля — Tuva Sport Shop', html: <h2>Код сброса: <strong></strong></h2><p>Действителен 15 минут.</p> }); } catch (err) { console.error('Resend:', err.message); console.log(DEV reset for : ); }
};
const sendTwoFactorCode = async (email, code) => {
  try { await resend.emails.send({ from: ${NAME} <>, to: email, subject: 'Код 2FA — Tuva Sport Shop', html: <h2>Код входа: <strong></strong></h2><p>Действителен 10 минут.</p> }); } catch (err) { console.error('Resend:', err.message); console.log(DEV 2FA for : ); }
};
const sendOrderStatusUpdate = async (email, fullName, orderId, status, items, totalPrice) => {
  const labels = { NEW:'Принят', PROCESSING:'В обработке', SHIPPED:'Отправлен', DONE:'Завершён', CANCELLED:'Отменён' };
  try { await resend.emails.send({ from: ${NAME} <>, to: email, subject: Заказ № — , html: <h2>Привет, !</h2><p>Заказ №: <strong></strong></p><p>Сумма:  ₽</p> }); } catch (err) { console.error('Resend:', err.message); }
};

module.exports = { sendVerificationCode, sendWelcomeEmail, sendResetCode, sendTwoFactorCode, sendOrderStatusUpdate };
