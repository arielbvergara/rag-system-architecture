import { Request, Response } from "express";
import { googleAuth } from "../config/google";
import { config } from "../config";
import { MenuService } from "../services/menu";
import { cache } from "../lib/cache";
import { MENU_CACHE_KEY } from "../lib/cacheKeys";
import { ApiResponse, MenuSection } from "../types";

export async function getMenu(
  _req: Request,
  res: Response<ApiResponse<MenuSection[]>>
): Promise<void> {
  try {
    const cached = cache.get(MENU_CACHE_KEY);
    if (cached) {
      res.json({ success: true, data: cached as MenuSection[] });
      return;
    }

    const menuService = new MenuService(googleAuth);
    const sections = await menuService.getMenuSectionsByGid(
      config.menuScanner.spreadsheetId,
      config.menuScanner.sheetGid,
    );

    cache.set(MENU_CACHE_KEY, sections);
    res.json({ success: true, data: sections });
  } catch (error: any) {
    console.error("Menu read error:", error.message);
    res.status(500).json({ success: false, error: "Failed to load menu" });
  }
}
