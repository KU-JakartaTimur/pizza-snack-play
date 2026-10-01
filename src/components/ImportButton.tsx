import { useRef } from "react";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui";

interface ImportButtonProps {
  /** Dipanggil dengan berkas yang dipilih. Berkasnya tidak diunggah dari sini. */
  onFile: (file: File) => void;
  /** Teks tombol, mis. `Impor Excel`. */
  label?: string;
  /** Ekstensi yang disaring dialog pemilih berkas. */
  accept?: string;
  /** Keterangan tambahan saat kursor berhenti di tombol. */
  title?: string;
  /** Matikan tombol selama data halaman belum siap. */
  disabled?: boolean;
  /** Tampilkan keadaan sibuk, mis. selama pratinjau dimuat. */
  loading?: boolean;
}

/**
 * Tombol "Impor Excel" yang dipakai bersama halaman yang punya impor.
 *
 * Sengaja hanya **memilih berkas**: isinya diteruskan ke `onFile`, dan
 * pemanggil yang memutuskan apa yang terjadi berikutnya (pratinjau, unggah,
 * dialog hasil). Tombol ini tidak tahu apa pun soal data yang diimpor.
 *
 * `input`-nya direset setiap kali dipilih, supaya berkas yang **sama** bisa
 * dipilih ulang — tanpa itu, memilih berkas yang gagal lalu mencoba lagi
 * dengan berkas yang sama tidak memicu apa-apa.
 */
export function ImportButton({
  onFile,
  label = "Impor Excel",
  accept = ".xlsx",
  title,
  disabled = false,
  loading = false,
}: ImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      <Button
        variant="secondary"
        size="sm"
        loading={loading}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        title={title ?? label}
      >
        {!loading && <FileUp className="h-4 w-4" />}
        {label}
      </Button>
    </div>
  );
}
