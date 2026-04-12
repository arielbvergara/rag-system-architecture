import type { ApiResponse, MenuScanResult } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function scanMenu(
  formData: FormData,
  token: string
): Promise<ApiResponse<MenuScanResult>> {
  const response = await fetch(`${API_BASE}/menu-scanner/scan`, {
    method: "POST",
    // No Content-Type header — browser sets multipart/form-data with boundary automatically
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
    return { success: false, error: error.error || "Request failed" };
  }

  return response.json();
}
