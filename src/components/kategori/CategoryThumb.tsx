import { Image as ImageIcon } from "lucide-react";
import type { CategoryDto } from "@/types/catalog";

/** Bagian kategori yang dibutuhkan penanda visualnya. */
export type CategoryThumbData = Pick<CategoryDto, "name" | "color" | "image">;

/**
 * Penanda visual kategori di daftar: gambarnya bila sudah diunggah, kalau
 * belum jatuh ke kotak warna.
 *
 * Kategori lama tetap punya penanda yang bisa dibedakan sebelum gambarnya
 * diisi — jadi memasang kolom `image` tidak membuat daftar tampak kosong.
 */
export function CategoryThumb({ category }: { category: CategoryThumbData }) {
  if (category.image) {
    return (
      <img
        src={category.image}
        alt={category.name}
        className="h-8 w-8 shrink-0 rounded-lg border border-slate-200 object-cover"
      />
    );
  }

  return (
    <span
      className="h-8 w-8 shrink-0 rounded-lg border border-slate-200"
      style={{ backgroundColor: category.color ?? "#E2E8F0" }}
    />
  );
}

/** Pratinjau gambar di dalam formulir; kotak kosong bila belum ada gambar. */
export function CategoryPreview({
  image,
  name,
}: {
  image: string | null;
  name: string;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={`Pratinjau ${name || "kategori"}`}
        className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
      />
    );
  }

  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-300">
      <ImageIcon className="h-5 w-5" />
    </span>
  );
}
