import ky from "ky";

/**
 * HTTP client untuk memanggil API Hono.
 * `prefixUrl: "/api"` — jadi `http.get("health")` memanggil `/api/health`.
 */
export const http = ky.create({
  prefixUrl: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  retry: 0,
  hooks: {
    beforeRequest: [
      (request) => {
        // Sisipkan JWT dari localStorage bila ada.
        const token =
          typeof localStorage !== "undefined"
            ? localStorage.getItem("psp_token")
            : null;
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
  },
});
