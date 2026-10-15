import { useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { RELATIONSHIP_OPTIONS } from "@/components/parents/form";
import {
  Button,
  Card,
  CardHeader,
  Field,
  InlineAlert,
  Input,
  Modal,
  Select,
  type ActionMessage,
} from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { whatsAppLink } from "@/lib/whatsapp";
import type { AccountUpdateInput } from "@/types/auth";
import {
  accountFormFrom,
  EMPTY_ACCOUNT_FORM,
  relationshipLabel,
  roleLabel,
  type AccountForm,
} from "./account";

/**
 * Kartu "Informasi Akun" di menu Profil.
 *
 * Orang tua boleh menyunting **data kontaknya sendiri** — nama sapaan,
 * hubungan dengan siswa, dan nomor WhatsApp. `Username` dan `Peran` hanya
 * ditampilkan: keduanya menentukan identitas login dan wewenang akun, jadi
 * tetap wewenang admin (`PUT /api/parents/:id`). Pembatasan yang sama
 * ditegakkan server, bukan sekadar disembunyikan di sini.
 */
export function AccountInfoCard() {
  const { user, isAdmin, refresh } = useAuth();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AccountForm>(EMPTY_ACCOUNT_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [banner, setBanner] = useState<ActionMessage | null>(null);

  const save = useMutation({
    mutationFn: (body: AccountUpdateInput) => api.profile.updateAccount(body),
    onSuccess: async (result) => {
      setFormOpen(false);
      setBanner({ tone: "ok", text: result.message });

      // Nama dan nomor juga muncul di header serta daftar orang tua petugas,
      // jadi profil di konteks sesi ikut disegarkan — bukan hanya kartu ini.
      // Kegagalannya tidak fatal: datanya sudah tersimpan di server.
      await refresh().catch(() => undefined);
    },
    onError: (error) => {
      setFormError(errorMessage(error));
    },
  });

  // Halaman ini ada di dalam rute ber-sesi, jadi `user` praktis selalu terisi;
  // penjagaan ini hanya agar tipe `AuthUser | null` tidak bocor ke bawah.
  if (!user) return null;

  const openEdit = () => {
    setForm(accountFormFrom(user));
    setFormError(null);
    setFormOpen(true);
  };

  /**
   * Periksa yang bisa diperiksa di sini, lalu kirim.
   *
   * Aturan bentuk nomor **tidak** diduplikasi di klien: server sudah
   * memeriksanya (`normalizePhone`) dan pesannya menyebut aturannya, sehingga
   * satu-satunya sumber kebenaran tetap satu.
   */
  const submit = () => {
    setFormError(null);

    if (!form.fullName.trim()) {
      setFormError("Nama wajib diisi");
      return;
    }

    save.mutate({
      fullName: form.fullName,
      relationship: form.relationship,
      phone: form.phone,
    });
  };

  const rows: InfoRowData[] = [
    { label: "Username", content: user.username },
    { label: "Nama", content: user.fullName ?? "-" },
    { label: "Peran", content: roleLabel(user.role) },
  ];

  if (user.relationship) {
    rows.push({
      label: "Hubungan",
      content: relationshipLabel(user.relationship),
    });
  }

  // Admin tidak punya nomor WhatsApp orang tua — barisnya hanya membingungkan.
  if (!isAdmin) {
    rows.push({
      label: "Nomor WhatsApp",
      content: <WhatsAppValue phone={user.phone} />,
    });
  }

  return (
    <Card>
      <CardHeader
        title="Informasi Akun"
        description={
          // Sengaja pendek: kartu ini hanya separuh lebar di layar besar, dan
          // keterangan yang panjang akan mendorong tombol "Ubah" turun ke
          // barisnya sendiri.
          isAdmin ? undefined : "Data kontak Anda — bisa diubah sendiri."
        }
        action={
          !isAdmin && (
            <Button variant="secondary" size="sm" onClick={openEdit}>
              <Pencil className="h-4 w-4" />
              Ubah
            </Button>
          )
        }
      />

      {banner && (
        <InlineAlert tone={banner.tone} className="mx-5 mt-4">
          {banner.text}
        </InlineAlert>
      )}

      <dl className="divide-y divide-slate-100 px-5">
        {rows.map((row) => (
          <InfoRow key={row.label} label={row.label}>
            {row.content}
          </InfoRow>
        ))}
      </dl>

      <Modal
        open={formOpen}
        title="Ubah informasi akun"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={submit} loading={save.isPending}>
              Simpan
            </Button>
          </>
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="space-y-4"
        >
          <Field label="Nama">
            <Input
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              placeholder="mis. Sari Wulandari"
              autoComplete="name"
            />
          </Field>

          <Field label="Hubungan">
            {/* Daftar yang sama dipakai form admin, agar pilihannya tidak
                pernah berbeda antara kedua layar. */}
            <Select
              value={form.relationship}
              onChange={(event) =>
                setForm({ ...form, relationship: event.target.value })
              }
            >
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Nomor WhatsApp"
            hint="Opsional. Boleh ditulis 0812… atau +62 812… — nomornya otomatis jadi tautan WhatsApp."
          >
            <Input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="08xxxxxxxxxx"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>

          {formError && <InlineAlert tone="error">{formError}</InlineAlert>}
        </form>
      </Modal>
    </Card>
  );
}

/** Satu baris kartu: label di kiri, isinya di kanan. */
interface InfoRowData {
  label: string;
  content: ReactNode;
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{children}</dd>
    </div>
  );
}

/**
 * Nilai nomor WhatsApp — tautan `wa.me` bila nomornya ada.
 *
 * Nomor yang belum diisi ditampilkan sebagai ajakan mengisi, bukan tanda
 * hubung: justru baris inilah yang memberi tahu orang tua bahwa nomornya
 * bisa ditambahkan dari sini.
 */
function WhatsAppValue({ phone }: { phone: string | null }) {
  const link = whatsAppLink(phone);
  if (!link) return <span className="font-normal text-slate-400">Belum diisi</span>;

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
    >
      {phone}
    </a>
  );
}
