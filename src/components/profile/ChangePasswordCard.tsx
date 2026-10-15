import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  Field,
  InlineAlert,
  Input,
  type ActionMessage,
} from "@/components/ui";
import { api, errorMessage } from "@/lib/api";

/** Panjang password baru yang diterima — server memakai batas yang sama. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Kartu "Ubah Password".
 *
 * Password lama diverifikasi server (`PUT /auth/password`), begitu pula
 * penolakan bila password barunya sama dengan yang lama. Yang diperiksa di
 * sini hanya hal yang bisa diketahui tanpa bertanya ke server — panjangnya dan
 * kecocokan konfirmasinya — supaya salah ketik tidak perlu satu perjalanan
 * bolak-balik hanya untuk diberi tahu.
 */
export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setMessage({
        tone: "error",
        text: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter`,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ tone: "error", text: "Konfirmasi password tidak cocok" });
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.auth.changePassword({ currentPassword, newPassword });
      setMessage({ tone: "ok", text: result.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage({ tone: "error", text: errorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Ubah Password"
        description={`Minimal ${MIN_PASSWORD_LENGTH} karakter dan berbeda dari password lama.`}
      />

      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
        <Field label="Password saat ini">
          <Input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>

        <Field label="Password baru">
          <Input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>

        <Field label="Konfirmasi password baru">
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>

        {message && <InlineAlert tone={message.tone}>{message.text}</InlineAlert>}

        <Button type="submit" loading={submitting}>
          <KeyRound className="h-4 w-4" />
          Simpan password
        </Button>
      </form>
    </Card>
  );
}
