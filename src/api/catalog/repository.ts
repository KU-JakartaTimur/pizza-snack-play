import { and, asc, eq, inArray, like, or, sql } from "drizzle-orm";
import type { Db } from "../../database/db";
import {
  categories,
  menuCategories,
  menuItems,
  menus,
  schedules,
} from "../../database/schema";
import type { Category, Menu, MenuItem } from "../../database/schema";
import { likePattern } from "../utils/sql";
import type {
  CategoryDto,
  MenuDto,
  MenuItemDto,
  MenuItemType,
} from "../../types/catalog";

export interface MenuItemRow extends MenuItem {
  categoryName: string | null;
  categoryColor: string | null;
}

class CatalogRepository {
  // ── Kategori ────────────────────────────────────────────────

  async listCategories(db: Db): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async countCategories(db: Db): Promise<number> {
    const rows = await db.select({ count: sql<number>`count(*)` }).from(categories);
    return rows[0]?.count ?? 0;
  }

  /** Jumlah menu: total (belum diarsipkan) dan yang aktif. */
  async countMenus(db: Db): Promise<{ total: number; active: number }> {
    const rows = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${menus.isActive} = 1 then 1 else 0 end)`,
      })
      .from(menus)
      .where(eq(menus.isArchived, 0));

    return { total: rows[0]?.total ?? 0, active: rows[0]?.active ?? 0 };
  }

  async findCategoryById(db: Db, id: number): Promise<Category | undefined> {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return rows[0];
  }

  async findCategoryBySlug(db: Db, slug: string): Promise<Category | undefined> {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    return rows[0];
  }

  async findCategoryByName(db: Db, name: string): Promise<Category | undefined> {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);
    return rows[0];
  }

  async insertCategory(
    db: Db,
    values: { name: string; slug: string; color?: string | null },
  ): Promise<Category> {
    const rows = await db.insert(categories).values(values).returning();
    return rows[0];
  }

  async updateCategory(
    db: Db,
    id: number,
    values: Partial<{ name: string; slug: string; color: string | null }>,
  ): Promise<Category | undefined> {
    const rows = await db
      .update(categories)
      .set({ ...values, updatedAt: sql`(datetime('now'))` })
      .where(eq(categories.id, id))
      .returning();
    return rows[0];
  }

  async deleteCategory(db: Db, id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  /** Jumlah menu yang memakai kategori ini — untuk mencegah hapus tak sengaja. */
  async countMenusUsingCategory(db: Db, categoryId: number): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(menuCategories)
      .where(eq(menuCategories.categoryId, categoryId));
    return rows[0]?.count ?? 0;
  }

  /** Jumlah jadwal yang memakai menu ini — menentukan arsip vs hapus permanen. */
  async countSchedulesUsingMenu(db: Db, menuId: number): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(schedules)
      .where(eq(schedules.menuId, menuId));
    return rows[0]?.count ?? 0;
  }

  // ── Menu ────────────────────────────────────────────────────

  async listMenus(
    db: Db,
    options: { search?: string; onlyActive?: boolean; includeArchived?: boolean } = {},
  ): Promise<Menu[]> {
    const filters = [];

    if (options.search) {
      const term = likePattern(options.search);
      filters.push(
        or(like(menus.name, term), like(menus.description, term)),
      );
    }
    if (options.onlyActive) {
      filters.push(eq(menus.isActive, 1));
    }
    if (!options.includeArchived) {
      filters.push(eq(menus.isArchived, 0));
    }

    return db
      .select()
      .from(menus)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(menus.name));
  }

  async findMenuById(db: Db, id: number): Promise<Menu | undefined> {
    const rows = await db.select().from(menus).where(eq(menus.id, id)).limit(1);
    return rows[0];
  }

  async findMenuByName(db: Db, name: string): Promise<Menu | undefined> {
    const rows = await db
      .select()
      .from(menus)
      .where(eq(menus.name, name))
      .limit(1);
    return rows[0];
  }

  async insertMenu(
    db: Db,
    values: { name: string; description?: string | null; isActive?: number },
  ): Promise<Menu> {
    const rows = await db.insert(menus).values(values).returning();
    return rows[0];
  }

  async updateMenu(
    db: Db,
    id: number,
    values: Partial<{
      name: string;
      description: string | null;
      isActive: number;
      isArchived: number;
    }>,
  ): Promise<Menu | undefined> {
    const rows = await db
      .update(menus)
      .set({ ...values, updatedAt: sql`(datetime('now'))` })
      .where(eq(menus.id, id))
      .returning();
    return rows[0];
  }

  async deleteMenu(db: Db, id: number): Promise<void> {
    await db.delete(menus).where(eq(menus.id, id));
  }

  // ── Komponen menu & relasi kategori ─────────────────────────

  async listMenuItems(db: Db, menuId: number): Promise<MenuItemRow[]> {
    return db
      .select({
        id: menuItems.id,
        menuId: menuItems.menuId,
        name: menuItems.name,
        itemType: menuItems.itemType,
        categoryId: menuItems.categoryId,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(menuItems)
      .leftJoin(categories, eq(menuItems.categoryId, categories.id))
      .where(eq(menuItems.menuId, menuId))
      .orderBy(asc(menuItems.id));
  }

  async replaceMenuItems(
    db: Db,
    menuId: number,
    items: {
      name: string;
      itemType?: MenuItemType;
      categoryId?: number | null;
    }[],
  ): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.menuId, menuId));
    if (items.length === 0) return;

    await db.insert(menuItems).values(
      items.map((item) => ({
        menuId,
        name: item.name,
        itemType: item.itemType ?? "main",
        categoryId: item.categoryId ?? null,
      })),
    );
  }

  async listMenuCategoryIds(db: Db, menuId: number): Promise<number[]> {
    const rows = await db
      .select({ categoryId: menuCategories.categoryId })
      .from(menuCategories)
      .where(eq(menuCategories.menuId, menuId));
    return rows.map((row) => row.categoryId);
  }

  async replaceMenuCategories(
    db: Db,
    menuId: number,
    categoryIds: number[],
  ): Promise<void> {
    await db
      .delete(menuCategories)
      .where(eq(menuCategories.menuId, menuId));
    if (categoryIds.length === 0) return;

    await db
      .insert(menuCategories)
      .values(categoryIds.map((categoryId) => ({ menuId, categoryId })));
  }

  /**
   * Muat banyak menu sekaligus (beserta komponen & kategori) dalam 3 query,
   * sehingga tidak terjadi N+1 saat menampilkan jadwal satu bulan.
   */
  async loadMenusByIds(db: Db, menuIds: number[]): Promise<Map<number, MenuDto>> {
    const unique = [...new Set(menuIds.filter((id) => Number.isInteger(id)))];
    const result = new Map<number, MenuDto>();
    if (unique.length === 0) return result;

    const menuRows = await db
      .select()
      .from(menus)
      .where(inArray(menus.id, unique));

    const itemRows = await db
      .select({
        id: menuItems.id,
        menuId: menuItems.menuId,
        name: menuItems.name,
        itemType: menuItems.itemType,
        categoryId: menuItems.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(menuItems)
      .leftJoin(categories, eq(menuItems.categoryId, categories.id))
      .where(inArray(menuItems.menuId, unique))
      .orderBy(asc(menuItems.id));

    const categoryRows = await db
      .select({
        menuId: menuCategories.menuId,
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        color: categories.color,
      })
      .from(menuCategories)
      .innerJoin(categories, eq(menuCategories.categoryId, categories.id))
      .where(inArray(menuCategories.menuId, unique));

    const itemsByMenu = new Map<number, MenuItemDto[]>();
    for (const row of itemRows) {
      const list = itemsByMenu.get(row.menuId) ?? [];
      list.push({
        id: row.id,
        name: row.name,
        itemType: row.itemType as MenuItemType,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        categoryColor: row.categoryColor,
      });
      itemsByMenu.set(row.menuId, list);
    }

    const categoriesByMenu = new Map<number, CategoryDto[]>();
    for (const row of categoryRows) {
      const list = categoriesByMenu.get(row.menuId) ?? [];
      list.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        color: row.color,
      });
      categoriesByMenu.set(row.menuId, list);
    }

    for (const menu of menuRows) {
      result.set(menu.id, {
        id: menu.id,
        name: menu.name,
        description: menu.description,
        isActive: menu.isActive === 1,
        isArchived: menu.isArchived === 1,
        items: itemsByMenu.get(menu.id) ?? [],
        categories: categoriesByMenu.get(menu.id) ?? [],
      });
    }

    return result;
  }

  /** Versi satu menu dari `loadMenusByIds`. */
  async loadMenuDto(db: Db, menuId: number): Promise<MenuDto | null> {
    const map = await this.loadMenusByIds(db, [menuId]);
    return map.get(menuId) ?? null;
  }
}

export const catalogRepository = new CatalogRepository();
