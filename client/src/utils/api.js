const API = import.meta.env.VITE_API_URL;

export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("/uploads/")) return `${API}${imageUrl}`;
  return imageUrl;
}

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
    return null;
  }

  return res;
}
