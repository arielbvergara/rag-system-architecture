import type { ApiResponse, CloudinaryImage, MenuSection, NearbyRestaurant, PlaceDetails } from "@/types";
import { scanMenu as scanMenuApi } from "./menuScannerApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    return { success: false, error: error.error || "Request failed" };
  }

  return response.json();
}

// ── Types ─────────────────────────────────────────────
export interface CreateEventPayload {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string }[];
}

export interface ContactRowPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
}

// ── Calendar ─────────────────────────────────────────
export const calendar = {
  listEvents: (maxResults = 10, date?: string) => {
    const params = new URLSearchParams({ maxResults: String(maxResults) });
    if (date) {
      params.set("timeMin", `${date}T00:00:00.000Z`);
      params.set("timeMax", `${date}T23:59:59.999Z`);
    }
    return request(`/calendar/events?${params}`);
  },
  createEvent: (event: CreateEventPayload) =>
    request("/calendar/events", { method: "POST", body: JSON.stringify(event) }),
};

// ── Sheets ───────────────────────────────────────────
export const sheets = {
  read: (spreadsheetId: string, range?: string) =>
    request(`/sheets/${spreadsheetId}${range ? `?range=${range}` : ""}`),
  appendRow: (row: ContactRowPayload) =>
    request("/sheets/rows", { method: "POST", body: JSON.stringify(row) }),
};

// ── Drive ────────────────────────────────────────────
export const drive = {
  listFiles: (pageSize = 20) =>
    request(`/drive/files?pageSize=${pageSize}`),
  downloadFile: (fileId: string) => `${API_BASE}/drive/files/${fileId}`,
};

// ── Email ─────────────────────────────────────────────
export const email = {
  send: (payload: SendEmailPayload) =>
    request("/email/send", { method: "POST", body: JSON.stringify(payload) }),
};

// ── Menu ──────────────────────────────────────────────
export const menu = {
  list: () => request<MenuSection[]>("/menu"),
};

// ── Chat ──────────────────────────────────────────────
export interface ChatMessagePayload {
  message: string;
}

export interface ChatReply {
  reply: string;
}

export const chat = {
  send: (payload: ChatMessagePayload) =>
    request<ChatReply>("/chat", { method: "POST", body: JSON.stringify(payload) }),
};

// ── Location ──────────────────────────────────────────
export const location = {
  getDetails: () => request<PlaceDetails>("/location"),
};

// ── Nearby Restaurants ────────────────────────────────
export const nearbyRestaurants = {
  getList: () => request<NearbyRestaurant[]>("/nearby-restaurants"),
};

// ── Admin ─────────────────────────────────────────────
export const admin = {
  authenticate: (password: string) =>
    request<{ token: string }>("/admin/auth", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  listImages: (token: string) =>
    request<CloudinaryImage[]>("/admin/images", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  deleteImage: (token: string, publicId: string) =>
    request(`/admin/images/${encodeURIComponent(publicId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// ── Menu Scanner ──────────────────────────────────────────
export const menuScanner = {
  scan: scanMenuApi,
};

export const api = { calendar, sheets, drive, email, menu, chat, location, nearbyRestaurants, admin, menuScanner };
export default api;
