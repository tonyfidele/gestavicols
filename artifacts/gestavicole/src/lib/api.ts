const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(url: string, options: RequestInit = {}) {
  try {
    const token = localStorage.getItem("auth_token");

    const res = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || "API Error");
    }

    return data;
  } catch (err) {
    console.error("API FETCH ERROR:", err);
    throw err;
  }
}