/** DTO katalog — kategori & menu. Dipakai bersama oleh API dan frontend. */

export type MenuItemType = "main" | "fruit" | "drink" | "other";

export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  color: string | null;
}

export interface MenuItemDto {
  id: number;
  name: string;
  itemType: MenuItemType;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
}

export interface MenuDto {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  isArchived: boolean;
  items: MenuItemDto[];
  categories: CategoryDto[];
}

/** Payload untuk membuat / mengubah menu. */
export interface MenuInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
  items?: {
    name: string;
    itemType?: MenuItemType;
    categoryId?: number | null;
  }[];
  categoryIds?: number[];
}

export interface CategoryInput {
  name: string;
  slug?: string;
  color?: string | null;
}
