import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookies_accepted");
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookies_accepted", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: "var(--primary)",
      borderTop: "1px solid rgba(200,149,42,.3)",
      padding: "16px 32px",
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      gap: 20, flexWrap: "wrap",
    }}>
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,.75)", maxWidth: 640 }}>
        Мы используем файлы cookie для улучшения работы сайта. Продолжая использовать
        сайт, вы соглашаетесь с нашей{" "}
        <Link to="/privacy" style={{ color: "var(--accent)" }}>
          политикой конфиденциальности
        </Link>.
      </p>
      <button
        onClick={accept}
        className="btn btn-primary"
        style={{
          flexShrink: 0,
          background: "var(--accent)",
          color: "var(--primary)",
          fontWeight: 700,
          border: "none",
        }}
      >
        Принять
      </button>
    </div>
  );
}

export default CookieBanner;
