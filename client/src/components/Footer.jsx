import { Link } from "react-router-dom";

const LINKS = [
  { to: "/about", label: "О магазине" },
  { to: "/catalog", label: "Каталог" },
  { to: "/privacy", label: "Конфиденциальность" },
  { to: "/terms", label: "Соглашение" },
];

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <div className="site-footer__brand">TYVA SPORT</div>
          <div className="site-footer__copy">
            © 2025 Интернет-магазин спортивных товаров Республики Тыва
          </div>
        </div>
        <nav className="site-footer__links">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
