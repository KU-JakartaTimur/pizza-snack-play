import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, UtensilsCrossed, X } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import type { MenuDto, MenuInput, MenuItemType } from "@/types/catalog";

export const Route = createFileRoute("/_app/menu")({
  component: MenusPage,
});

const ITEM_TYPE_OPTIONS: { value: MenuItemType; label: string }[] = [
  { value: "main", label: "Makanan utama" },
  { value: "fruit", label: "Buah" },
  { value: "drink", label: "Minuman" },
  { value: "other", label: "Pelengkap" },
];

interface FormItem {
  name: string;
  itemType: MenuItemType;
}

interface MenuForm {
  name: string;
  description: string;
  isActive: boolean;
  items: FormItem[];
  categoryIds: number[];
}

const EMPTY_FORM: MenuForm = {
  name: "",
  description: "",
  isActive: true,
  items: [{ name: "", itemType: "main" }],
  categoryIds: [],
};

function MenusPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MenuDto | null>(null);
  const [form, setForm] = useState<MenuForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );

  const menusQuery = useQuery({
    queryKey: ["menus", { search }],
    queryFn: () => api.menus.list({ search: search.trim() || undefined }),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories.list,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["menus"] });
    await queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: MenuInput = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        isActive: form.isActive,
        items: form.items
          .filter((item) => item.name.trim())
          .map((item) => ({ name: item.name.trim(), itemType: item.itemType })),
        categoryIds: form.categoryIds,
      };

      return editing
        ? api.menus.update(editing.id, payload)
        : api.menus.create(payload);
    },
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      setModalOpen(false);
      await invalidate();
    },
    onError: (error) =>
      setFormError(
        error instanceof ApiError ? error.message : "Tidak bisa menyimpan menu",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.menus.remove(id),
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: error instanceof ApiError ? error.message : "Gagal menghapus menu",
      }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (menu: MenuDto) => {
    setEditing(menu);
    setForm({
      name: menu.name,
      description: menu.description ?? "",
      isActive: menu.isActive,
      items:
        menu.items.length > 0
          ? menu.items.map((item) => ({
              name: item.name,
              itemType: item.itemType,
            }))
          : [{ name: "", itemType: "main" }],
      categoryIds: menu.categories.map((category) => category.id),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Nama menu wajib diisi");
      return;
    }
    if (!form.items.some((item) => item.name.trim())) {
      setFormError("Menu harus punya minimal satu komponen");
      return;
    }

    saveMutation.mutate();
  };

  const updateItem = (index: number, patch: Partial<FormItem>) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));

  const addItem = () =>
    setForm((current) => ({
      ...current,
      items: [...current.items, { name: "", itemType: "fruit" }],
    }));

  const removeItem = (index: number) =>
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== index),
    }));

  const toggleCategory = (id: number) =>
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(id)
        ? current.categoryIds.filter((value) => value !== id)
        : [...current.categoryIds, id],
    }));

  const menus = menusQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Menu Snack"
        description="Katalog menu — makanan utama beserta buah pendamping."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Menu baru
          </Button>
        }
      />

      {banner && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            banner.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari menu…"
          className="pl-9"
        />
      </div>

      <Card>
        {menusQuery.isPending && <Spinner />}

        {menusQuery.isError && (
          <ErrorState
            message={menusQuery.error.message}
            onRetry={() => void menusQuery.refetch()}
          />
        )}

        {menusQuery.data && menus.length === 0 && (
          <EmptyState
            icon={<UtensilsCrossed className="h-8 w-8" />}
            title={search ? "Menu tidak ditemukan" : "Belum ada menu"}
            description={
              search
                ? `Tidak ada menu yang cocok dengan "${search}".`
                : "Tambahkan menu beserta komponennya."
            }
            action={
              !search ? <Button onClick={openCreate}>Tambah menu</Button> : undefined
            }
          />
        )}

        {menus.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {menus.map((menu) => (
              <li key={menu.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{menu.name}</p>
                      {!menu.isActive && <Badge tone="warning">Nonaktif</Badge>}
                      {menu.isArchived && <Badge tone="neutral">Diarsipkan</Badge>}
                    </div>

                    {menu.description && (
                      <p className="mt-0.5 text-sm text-slate-500">
                        {menu.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {menu.items.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                          title={
                            ITEM_TYPE_OPTIONS.find((o) => o.value === item.itemType)
                              ?.label
                          }
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>

                    {menu.categories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {menu.categories.map((category) => (
                          <Badge key={category.id} tone="info">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(menu)}
                      title="Ubah"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Hapus menu "${menu.name}"?`)) {
                          deleteMutation.mutate(menu.id);
                        }
                      }}
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? "Ubah menu" : "Menu baru"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              loading={saveMutation.isPending}
              type="submit"
            >
              Simpan
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nama menu">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="mis. Roti isi coklat + jeruk"
              autoFocus
            />
          </Field>

          <Field label="Deskripsi" hint="Opsional.">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Catatan singkat tentang menu ini"
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Komponen</span>
              <Button variant="ghost" size="sm" type="button" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </Button>
            </div>

            <div className="space-y-2">
              {form.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item.name}
                    onChange={(event) =>
                      updateItem(index, { name: event.target.value })
                    }
                    placeholder="Nama komponen"
                  />
                  <Select
                    value={item.itemType}
                    onChange={(event) =>
                      updateItem(index, {
                        itemType: event.target.value as MenuItemType,
                      })
                    }
                    className="w-40 shrink-0"
                  >
                    {ITEM_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeItem(index)}
                    disabled={form.items.length === 1}
                    title="Hapus komponen"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {categoriesQuery.data && categoriesQuery.data.length > 0 && (
            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Kategori
              </span>
              <div className="flex flex-wrap gap-2">
                {categoriesQuery.data.map((category) => {
                  const checked = form.categoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        checked
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm({ ...form, isActive: event.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Menu aktif (bisa dipakai pada jadwal)
          </label>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
        </form>
      </Modal>
    </>
  );
}
