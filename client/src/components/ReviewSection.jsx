import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export function StarRating({ value, onChange, readonly = false, size = "md" }) {
  const [hover, setHover] = useState(0);
  const fontSize = readonly ? (size === "sm" ? 14 : 16) : 24;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            fontSize,
            cursor: readonly ? "default" : "pointer",
            color: star <= (hover || value) ? "#c8a96e" : "#d1d5db",
            transition: "color .12s",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ rating: 0, text: "" });
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {}
  const token = localStorage.getItem("token");

  const loadReviews = async () => {
    try {
      const res = await fetch(`${API}/api/products/${productId}/reviews`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setAvgRating(data.avgRating);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating === 0) {
      setMsg({ text: "Поставьте оценку от 1 до 5", type: "error" });
      return;
    }
    if (form.text.trim().length < 5) {
      setMsg({ text: "Напишите отзыв (минимум 5 символов)", type: "error" });
      return;
    }

    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await fetch(`${API}/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: form.rating, text: form.text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.message, type: "error" });
        return;
      }
      setForm({ rating: 0, text: "" });
      setMsg({ text: "Отзыв опубликован!", type: "success" });
      loadReviews();
    } catch {
      setMsg({ text: "Ошибка сервера", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Удалить отзыв?")) return;
    try {
      await fetch(`${API}/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadReviews();
    } catch (e) {
      console.error(e);
    }
  };

  const plural = (n) =>
    n === 1 ? "отзыв" : n >= 2 && n <= 4 ? "отзыва" : "отзывов";

  return (
    <div>
      {/* Заголовок */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 28,
          paddingBottom: 20,
          borderBottom: "1px solid var(--line)",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Отзывы</h2>
        {avgRating ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#c8a96e",
                lineHeight: 1,
              }}
            >
              {avgRating}
            </span>
            <div>
              <StarRating value={Math.round(Number(avgRating))} readonly />
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                {total} {plural(total)}
              </div>
            </div>
          </div>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Пока нет отзывов — будьте первым
          </span>
        )}
      </div>

      {/* Форма */}
      {currentUser && (
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            padding: 24,
            marginBottom: 28,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Оставить отзыв
          </h3>
          {msg.text && (
            <div className={`toast toast--${msg.type}`}>{msg.text}</div>
          )}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                Ваша оценка
              </div>
              <StarRating
                value={form.rating}
                onChange={(v) => setForm((p) => ({ ...p, rating: v }))}
              />
            </div>
            <textarea
              placeholder="Расскажите о товаре подробнее..."
              value={form.text}
              onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
              style={{
                padding: "12px 14px",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-md)",
                fontSize: 14,
                minHeight: 90,
                resize: "vertical",
                fontFamily: "inherit",
                background: "var(--bg)",
                color: "var(--paper)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ alignSelf: "flex-start" }}
            >
              {loading ? "Отправка..." : "Опубликовать отзыв"}
            </button>
          </form>
        </div>
      )}

      {!currentUser && (
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
          Войдите в аккаунт и приобретите товар, чтобы оставить отзыв.
        </p>
      )}

      {/* Список отзывов */}
      {reviews.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{ fontWeight: 700, fontSize: 14, marginBottom: 5 }}
                  >
                    {review.user?.fullName || "Пользователь"}
                  </div>
                  <StarRating value={review.rating} readonly />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                  {(currentUser?.id === review.userId ||
                    currentUser?.role === "ADMIN") && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      title="Удалить отзыв"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: 14,
                        padding: 0,
                        lineHeight: 1,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.color = "var(--red)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.color = "var(--text-muted)")
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {review.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewSection;
