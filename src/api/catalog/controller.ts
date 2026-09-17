import type { Context } from "hono";
import { getDb } from "../../database/db";
import type {
  CategoryInput,
  MenuInput,
  MenuItemType,
} from "../../types/catalog";
import type { AuthEnv } from "../middleware/auth";
import { parseId as parseIdParam } from "../utils/params";
import {
  responseBadRequest,
  responseConflict,
  responseCreated,
  responseNotFound,
  responseOK,
} from "../utils/response";
import { MENU_ITEM_TYPES, catalogService, type CatalogError } from "./service";

type CatalogContext = Context<AuthEnv>;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function mapError(c: CatalogContext, error: CatalogError) {
  switch (error) {
    case "not_found":
      return responseNotFound(c, "Data tidak ditemukan");
    case "duplicate_name":
      return responseConflict(c, "Nama sudah dipakai");
    case "in_use":
      return responseConflict(
        c,
        "Kategori masih dipakai menu lain, tidak bisa dihapus",
      );
  }
}

function parseId(raw: string | undefined): number | null {
  return parseIdParam(raw);
}

/** Validasi & normalisasi daftar komponen menu dari body request. */function parseMenuItems(
  raw: unknown,
): { ok: true; items: NonNullable<MenuInput["items"]> } | { ok: false; message: string } {
  if (raw === undefined) return { ok: true, items: [] };
  if (!Array.isArray(raw)) {
    return { ok: false, message: "`items` harus berupa array" };
  }

  const items: NonNullable<MenuInput["items"]> = [];

  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) {
      return { ok: false, message: "Setiap item harus berupa objek" };
    }
    const item = entry as Record<string, unknown>;
    const name = typeof item.name === "string" ? item.name.trim() : "";

    if (!name) {
      return { ok: false, message: "Nama item wajib diisi" };
    }

    const itemType = item.itemType;
    if (
      itemType !== undefined &&
      (typeof itemType !== "string" ||
        !MENU_ITEM_TYPES.includes(itemType as MenuItemType))
    ) {
      return {
        ok: false,
        message: `itemType harus salah satu dari: ${MENU_ITEM_TYPES.join(", ")}`,
      };
    }

    const categoryId = item.categoryId;
    if (
      categoryId !== undefined &&
      categoryId !== null &&
      !Number.isInteger(categoryId)
    ) {
      return { ok: false, message: "categoryId harus berupa angka" };
    }

    items.push({
      name,
      itemType: (itemType as MenuItemType | undefined) ?? "main",
      categoryId: (categoryId as number | null | undefined) ?? null,
    });
  }

  return { ok: true, items };
}

class CatalogController {
  // ── Kategori ────────────────────────────────────────────────

  listCategories = async (c: CatalogContext) => {
    const categories = await catalogService.listCategories(getDb(c.env));
    return responseOK(c, "Daftar kategori", categories);
  };

  getCategory = async (c: CatalogContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const category = await catalogService.getCategory(getDb(c.env), id);
    if (!category) return responseNotFound(c, "Kategori tidak ditemukan");

    return responseOK(c, "Detail kategori", category);
  };

  createCategory = async (c: CatalogContext) => {
    let body: Partial<CategoryInput>;
    try {
      body = await c.req.json<Partial<CategoryInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return responseBadRequest(c, "Nama kategori wajib diisi");

    if (body.color !== undefined && body.color !== null) {
      if (typeof body.color !== "string" || !HEX_COLOR.test(body.color)) {
        return responseBadRequest(c, "Warna harus format hex, contoh #FFAA00");
      }
    }

    const result = await catalogService.createCategory(getDb(c.env), {
      name,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      color: typeof body.color === "string" ? body.color : undefined,
    });

    if (typeof result === "string") return mapError(c, result);
    return responseCreated(c, "Kategori berhasil dibuat", result);
  };

  updateCategory = async (c: CatalogContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    let body: Partial<CategoryInput>;
    try {
      body = await c.req.json<Partial<CategoryInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    if (body.name !== undefined && !body.name.trim()) {
      return responseBadRequest(c, "Nama kategori tidak boleh kosong");
    }
    if (
      body.color !== undefined &&
      body.color !== null &&
      (typeof body.color !== "string" || !HEX_COLOR.test(body.color))
    ) {
      return responseBadRequest(c, "Warna harus format hex, contoh #FFAA00");
    }

    const result = await catalogService.updateCategory(getDb(c.env), id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
      ...(body.color !== undefined ? { color: body.color } : {}),
    });

    if (typeof result === "string") return mapError(c, result);
    return responseOK(c, "Kategori berhasil diperbarui", result);
  };

  deleteCategory = async (c: CatalogContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const result = await catalogService.deleteCategory(getDb(c.env), id);
    if (result !== true) return mapError(c, result);

    return responseOK(c, "Kategori berhasil dihapus");
  };

  // ── Menu ────────────────────────────────────────────────────

  listMenus = async (c: CatalogContext) => {
    const search = c.req.query("search")?.trim();
    const onlyActive = c.req.query("active") === "true";
    const includeArchived = c.req.query("archived") === "true";

    const menus = await catalogService.listMenus(getDb(c.env), {
      search: search || undefined,
      onlyActive,
      includeArchived,
    });

    return responseOK(c, "Daftar menu", menus);
  };

  getMenu = async (c: CatalogContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const menu = await catalogService.getMenu(getDb(c.env), id);
    if (!menu) return responseNotFound(c, "Menu tidak ditemukan");

    return responseOK(c, "Detail menu", menu);
  };

  createMenu = async (c: CatalogContext) => {
    let body: Partial<MenuInput>;
    try {
      body = await c.req.json<Partial<MenuInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return responseBadRequest(c, "Nama menu wajib diisi");

    const parsedItems = parseMenuItems(body.items);
    if (!parsedItems.ok) return responseBadRequest(c, parsedItems.message);
    if (parsedItems.items.length === 0) {
      return responseBadRequest(c, "Menu harus punya minimal satu komponen");
    }

    const categoryIds = Array.isArray(body.categoryIds)
      ? body.categoryIds.filter((value): value is number => Number.isInteger(value))
      : [];

    const result = await catalogService.createMenu(getDb(c.env), {
      name,
      description:
        typeof body.description === "string" ? body.description : null,
      isActive: body.isActive,
      items: parsedItems.items,
      categoryIds,
    });

    if (typeof result === "string") return mapError(c, result);
    return responseCreated(c, "Menu berhasil dibuat", result);
  };

  updateMenu = async (c: CatalogContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    let body: Partial<MenuInput>;
    try {
      body = await c.req.json<Partial<MenuInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    if (body.name !== undefined && !body.name.trim()) {
      return responseBadRequest(c, "Nama menu tidak boleh kosong");
    }

    const parsedItems = parseMenuItems(body.items);
    if (!parsedItems.ok) return responseBadRequest(c, parsedItems.message);

    const categoryIds = Array.isArray(body.categoryIds)
      ? body.categoryIds.filter((value): value is number => Number.isInteger(value))
      : undefined;

    const result = await catalogService.updateMenu(getDb(c.env), id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.items !== undefined ? { items: parsedItems.items } : {}),
      ...(categoryIds !== undefined ? { categoryIds } : {}),
    });

    if (typeof result === "string") return mapError(c, result);
    return responseOK(c, "Menu berhasil diperbarui", result);
  };

  deleteMenu = async (c: CatalogContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const force = c.req.query("force") === "true";
    const result = await catalogService.deleteMenu(getDb(c.env), id, { force });

    if (result === "not_found") return mapError(c, result);

    return responseOK(
      c,
      result === "archived"
        ? "Menu masih dipakai jadwal — menu diarsipkan, bukan dihapus"
        : "Menu berhasil dihapus",
      { action: result },
    );
  };

  listItemTypes = async (c: CatalogContext) => {
    return responseOK(c, "Jenis komponen menu", catalogService.listMenuItemTypes());
  };
}

export const catalogController = new CatalogController();
