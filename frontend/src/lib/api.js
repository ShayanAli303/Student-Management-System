const getCookie = (name) => {
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
};

const request = async (url, options = {}) => {
  const config = {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
      ...(options.headers || {}),
    },
    ...options,
  };

  if (config.body && typeof config.body !== "string") {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstFieldError = Object.entries(data).find(
      ([key, value]) => key !== "detail" && key !== "non_field_errors" && Array.isArray(value) && value.length,
    );
    const detail = data.detail || data.non_field_errors?.[0] || firstFieldError?.[1]?.[0] || "Request failed.";
    throw new Error(detail);
  }

  return data;
};

export const api = {
  get: (url) => request(url, { method: "GET" }),
  post: (url, body) => request(url, { method: "POST", body }),
  put: (url, body) => request(url, { method: "PUT", body }),
  patch: (url, body) => request(url, { method: "PATCH", body }),
  delete: (url) => request(url, { method: "DELETE" }),
};
