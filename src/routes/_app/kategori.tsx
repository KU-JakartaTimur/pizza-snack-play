import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { RoleGate } from "@/components/AdminOnly";
import { PageHeader } from "@/components/AppShell";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Spinner,
} from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import type { CategoryDto } from "@/types/catalog";

export const Route = createFileRoute("/_app/kategori")({
  component: CategoriesPage,
});

const EMPTY_FORM = { name: "", color: "#10B981" };

function CategoriesPage() {
  return (
    <RoleGate need="catalog">
      <CategoriesContent />
    </RoleGate>
  );
}

function CategoriesContent() {
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Kategori yang menunggu ditegaskan penghapusannya. Dialog konfirmasi
  // menggantikan `confirm()` bawaan peramban, yang tidak bisa diberi nada
  // maupun gaya dan memblokir seluruh halaman.
  const [pendingDelete, setPendingDelete] = useState<CategoryDto | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories.list,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["categories"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name.trim(), color: form.color };
      return editing
        ? api.categories.update(editing.id, payload)
        : api.categories.create(payload);
    },
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      setModalOpen(false);
      await invalidate();
    },
    onError: (error) =>
      setFormError(errorMessage(error, "Tidak bisa menyimpan data")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.categories.remove(id),
    onSuccess: async (result) => {
      setPendingDelete(null);
      setBanner({ kind: "ok", text: result.message });
      await invalidate();
    },
    onError: (error) => {
      setPendingDelete(null);
      setBanner({ kind: "error", text: errorMessage(error, "Gagal menghapus") });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (category: CategoryDto) => {
    setEditing(category);
    setForm({ name: category.name, color: category.color ?? "#10B981" });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!form.name.trim()) {
      setFormError("Nama kategori wajib diisi");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <>
      <PageHeader
        title="Kategori Menu"
        description="Kelompokkan komponen menu, mis. gorengan, buah segar, atau roti."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Kategori baru
          </Button>
        }
      />

      {banner && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            banner.kind === "ok"
              ? "border-brand-200 bg-brand-50 text-brand-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner.text}
        </div>
      )}

      <Card>
        {categoriesQuery.isPending && <Spinner />}

        {categoriesQuery.isError && (
          <ErrorState
            message={categoriesQuery.error.message}
            onRetry={() => void categoriesQuery.refetch()}
          />
        )}

        {categoriesQuery.data?.length === 0 && (
          <EmptyState
            icon={<Tags className="h-8 w-8" />}
            title="Belum ada kategori"
            description="Tambahkan kategori untuk mengelompokkan komponen menu."
            action={<Button onClick={openCreate}>Tambah kategori</Button>}
          />
        )}

        {categoriesQuery.data && categoriesQuery.data.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {categoriesQuery.data.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-8 w-8 shrink-0 rounded-lg border border-slate-200"
                    style={{ backgroundColor: category.color ?? "#E2E8F0" }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{category.name}</p>
                    <p className="font-mono text-xs text-slate-400">
                      {category.slug}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge>{category.color ?? "—"}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(category)}
                    title="Ubah"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setPendingDelete(category)}
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? "Ubah kategori" : "Kategori baru"}
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
          <Field label="Nama kategori">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="mis. Buah segar"
              autoFocus
            />
          </Field>

          <Field label="Warna" hint="Dipakai sebagai penanda visual.">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300"
              />
              <Input
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                className="font-mono"
              />
            </div>
          </Field>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus kategori?"
        description={
          <>
            Kategori <strong>{pendingDelete?.name}</strong> akan dihapus.
            Kategori yang masih dipakai menu lain tidak bisa dihapus — lepaskan
            dulu dari menunya.
          </>
        }
        confirmLabel="Hapus"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() =>
          pendingDelete && deleteMutation.mutate(pendingDelete.id)
        }
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}
