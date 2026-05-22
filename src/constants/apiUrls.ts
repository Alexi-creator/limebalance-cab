const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"

export const API_URLS = {
  auth: {
    register: `${API_URL}/auth/register`,
    login: `${API_URL}/auth/login`,
    google: `${API_URL}/auth/google`,
    telegram: `${API_URL}/auth/telegram`,
    refresh: `${API_URL}/auth/refresh`,
    logout: `${API_URL}/auth/logout`,
    me: `${API_URL}/auth/me`,
    linkGoogle: `${API_URL}/auth/link/google`,
    linkTelegram: `${API_URL}/auth/link/telegram`,
  },
  users: {
    users: `${API_URL}/users`,
    user: `${API_URL}/users/:id`,
  },
  expenses: {
    expenses: `${API_URL}/expenses`,
    expense: `${API_URL}/expenses/:id`,
  },
  categories: {
    categories: `${API_URL}/categories`,
    category: `${API_URL}/categories/:id`,
  },
}
