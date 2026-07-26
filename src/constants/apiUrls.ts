import { getEnv } from "@constants/env"

const API_URL = getEnv("VITE_API_URL") || "http://localhost:3000/api"

export const API_URLS = {
  auth: {
    register: `${API_URL}/auth/register`,
    login: `${API_URL}/auth/login`,
    google: `${API_URL}/auth/google`,
    telegram: `${API_URL}/auth/telegram`,
    refresh: `${API_URL}/auth/refresh`,
    logout: `${API_URL}/auth/logout`,
    me: `${API_URL}/auth/me`,
    credentials: `${API_URL}/auth/me/credentials`,
    confirmEmail: `${API_URL}/auth/confirm-email`,
    resendEmailConfirmation: `${API_URL}/auth/resend-email-confirmation`,
    forgotPassword: `${API_URL}/auth/forgot-password`,
    resetPassword: `${API_URL}/auth/reset-password`,
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
    summary: `${API_URL}/expenses/summary`,
    stat: `${API_URL}/expenses/stat`,
  },
  incomes: {
    incomes: `${API_URL}/incomes`,
    income: `${API_URL}/incomes/:id`,
    summary: `${API_URL}/incomes/summary`,
    stat: `${API_URL}/incomes/stat`,
  },
  transactions: {
    transactions: `${API_URL}/transactions`,
    balance: `${API_URL}/transactions/balance`,
  },
  expenseCategories: {
    categories: `${API_URL}/expense-categories`,
    category: `${API_URL}/expense-categories/:id`,
    stats: `${API_URL}/expense-categories/stats`,
  },
  incomeCategories: {
    categories: `${API_URL}/income-categories`,
    category: `${API_URL}/income-categories/:id`,
    stats: `${API_URL}/income-categories/stats`,
  },
  notifications: {
    notifications: `${API_URL}/notifications`,
    readAll: `${API_URL}/notifications/read-all`,
    preferences: `${API_URL}/notifications/preferences`,
  },
  goals: {
    goals: `${API_URL}/goals`,
  },
  subscriptions: {
    usage: `${API_URL}/subscriptions/usage`,
  },
  investing: {
    accounts: `${API_URL}/investing/accounts`,
    positions: `${API_URL}/investing/positions`,
    positionSymbols: `${API_URL}/investing/positions/symbols`,
    positionsSummary: `${API_URL}/investing/positions/summary`,
    equityCurve: `${API_URL}/investing/positions/equity-curve`,
    trades: `${API_URL}/investing/trades`,
    holdings: `${API_URL}/investing/holdings`,
  },
}
