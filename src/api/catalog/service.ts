import type { Db } from "../../database/db";
import type {
  CategoryDto,
  CategoryInput,
  MenuDto,
  MenuInput,
  MenuItemType,
} from "../../types/catalog";
import { slugify } from "../utils/slug";
import { catalogRepository } from "./repository";

export type CatalogError = "not_found" | "duplicate_name" | "in_use";

export const MENU_ITEM_TYPES: MenuItemType[] = ["main", "fruit", "drink", "other"];

function toCategoryDto(row: {
  id: number;
  name: string;
  slug: string;
  color: string | null;
}): CategoryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
  };
}

class CatalogService {
  // ── Kategori ────────────────────────────────────────────────

  async listCategories(db: Db): Promise<CategoryDto[]> {
    const rows = await catalogRepository.listCategories(db);
    return rows.map(toCategoryDto);
  }

  async getCategory(db: Db, id: number): Promise<CategoryDto | null> {
    const row = await catalogRepository.findCategoryById(db, id);
    return row ? toCategoryDto(row) : null;
  }

  async createCategory(
    db: Db,
    input: CategoryInput,
  ): Promise<CategoryDto | CatalogError> {
    const existing = await catalogRepository.findCategoryByName(db, input.name);
    if (existing) return "duplicate_name";

    const slug = input.slug?.trim() || slugify(input.name);
    const slugTaken = await catalogRepository.findCategoryBySlug(db, slug);

    const row = await catalogRepository.insertCategory(db, {
      name: input.name.trim(),
      slug: slugTaken ? `${slug}-${Date.now().toString(36)}` : slug,
      color: input.color ?? "#CCCCCC",
    });

    return toCategoryDto(row);
  }

  async updateCategory(
    db: Db,
    id: number,
    input: Partial<CategoryInput>,
  ): Promise<CategoryDto | CatalogError> {
    const current = await catalogRepository.findCategoryById(db, id);
    if (!current) return "not_found";

    if (input.name && input.name.trim() !== current.name) {
      const clash = await catalogRepository.findCategoryByName(
        db,
        input.name.trim(),
      );
      if (clash) return "duplicate_name";
    }

    const row = await catalogRepository.updateCategory(db, id, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined ? { slug: slugify(input.slug) } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
    });

    return row ? toCategoryDto(row) : "not_found";
  }

  async deleteCategory(db: Db, id: number): Promise<true | CatalogError> {
    const current = await catalogRepository.findCategoryById(db, id);
    if (!current) return "not_found";

    const used = await catalogRepository.countMenusUsingCategory(db, id);
    if (used > 0) return "in_use";

    await catalogRepository.deleteCategory(db, id);
    return true;
  }

  // ── Menu ────────────────────────────────────────────────────

  async listMenus(
    db: Db,
    options: { search?: string; onlyActive?: boolean; includeArchived?: boolean } = {},
  ): Promise<MenuDto[]> {
    const rows = await catalogRepository.listMenus(db, options);
    if (rows.length === 0) return [];

    const map = await catalogRepository.loadMenusByIds(
      db,
      rows.map((row) => row.id),
    );

    // Pertahankan urutan hasil query (sudah terurut berdasarkan nama).
    return rows
      .map((row) => map.get(row.id))
      .filter((menu): menu is MenuDto => Boolean(menu));
  }

  async getMenu(db: Db, id: number): Promise<MenuDto | null> {
    return catalogRepository.loadMenuDto(db, id);
  }

  async createMenu(db: Db, input: MenuInput): Promise<MenuDto | CatalogError> {
    const name = input.name.trim();
    const existing = await catalogRepository.findMenuByName(db, name);
    if (existing) return "duplicate_name";

    const menu = await catalogRepository.insertMenu(db, {
      name,
      description: input.description ?? null,
      isActive: input.isActive === false ? 0 : 1,
    });

    await catalogRepository.replaceMenuItems(db, menu.id, input.items ?? []);
    await catalogRepository.replaceMenuCategories(
      db,
      menu.id,
      input.categoryIds ?? [],
    );

    return (await catalogRepository.loadMenuDto(db, menu.id))!;
  }

  async updateMenu(
    db: Db,
    id: number,
    input: Partial<MenuInput>,
  ): Promise<MenuDto | CatalogError> {
    const current = await catalogRepository.findMenuById(db, id);
    if (!current) return "not_found";

    if (input.name && input.name.trim() !== current.name) {
      const clash = await catalogRepository.findMenuByName(db, input.name.trim());
      if (clash) return "duplicate_name";
    }

    await catalogRepository.updateMenu(db, id, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
    });

    if (input.items !== undefined) {
      await catalogRepository.replaceMenuItems(db, id, input.items);
    }
    if (input.categoryIds !== undefined) {
      await catalogRepository.replaceMenuCategories(db, id, input.categoryIds);
    }

    return (await catalogRepository.loadMenuDto(db, id))!;
  }

  /**
   * Arsipkan menu (soft delete) bila masih dipakai jadwal, atau hapus permanen
   * bila belum pernah dipakai. Mencegah jadwal lama kehilangan referensi menu.
   */
  async deleteMenu(
    db: Db,
    id: number,
    options: { force?: boolean } = {},
  ): Promise<"deleted" | "archived" | CatalogError> {
    const current = await catalogRepository.findMenuById(db, id);
    if (!current) return "not_found";

    if (options.force) {
      await catalogRepository.deleteMenu(db, id);
      return "deleted";
    }

    const used = await catalogRepository.countSchedulesUsingMenu(db, id);
    if (used > 0) {
      await catalogRepository.updateMenu(db, id, { isArchived: 1, isActive: 0 });
      return "archived";
    }

    await catalogRepository.deleteMenu(db, id);
    return "deleted";
  }

  listMenuItemTypes(): MenuItemType[] {
    return MENU_ITEM_TYPES;
  }
}

export const catalogService = new CatalogService();
