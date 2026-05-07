function NotFoundPage() {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ fontSize: 72 }}>🏔️</div>
      <h1 style={{ fontFamily: "Unbounded", fontSize: 48, color: "var(--earth)" }}>404</h1>
      <p style={{ color: "var(--stone)", marginBottom: 24 }}>Страница не найдена</p>
      <a href="/" className="btn btn-primary">На главную</a>
    </div>
  );
}

export default NotFoundPage;
