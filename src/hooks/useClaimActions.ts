import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "@/lib/api";

/**
 * Aksi mengambil & membatalkan tanggal snack.
 *
 * Dipisahkan dari halaman supaya urusan "kalah cepat" (409) dan penyegaran
 * jadwal tidak tercampur dengan tata letak. Pesan konflik disimpan di sini
 * karena hanya relevan selama satu tindakan berlangsung.
 *
 * `studentId` adalah anak yang diwakili — dipilih sekali di atas halaman dan
 * berlaku untuk semua pengambilan berikutnya.
 */
export function useClaimActions(studentId: number | null) {
  const queryClient = useQueryClient();
  const [conflict, setConflict] = useState<string | null>(null);

  /** Jadwal berubah setelah tindakan apa pun, termasuk saat kalah cepat. */
  const refreshSchedules = () =>
    void queryClient.invalidateQueries({ queryKey: ["schedules"] });

  const takeMutation = useMutation({
    mutationFn: (scheduleId: number) =>
      api.claims.take({ scheduleId, studentId }),
    onSuccess: refreshSchedules,
    onError: (error) => {
      // 409 = kalah cepat dari orang tua lain. Pesannya sudah menyebut nama
      // pemiliknya, jadi tinggal ditampilkan apa adanya — tetapi datanya tetap
      // disegarkan supaya tanggal itu langsung terlihat sudah terisi.
      setConflict(errorMessage(error));
      refreshSchedules();
    },
  });

  const releaseMutation = useMutation({
    mutationFn: (claimId: number) => api.claims.release(claimId),
    onSuccess: refreshSchedules,
    onError: (error) => setConflict(errorMessage(error)),
  });

  return {
    take: (scheduleId: number) => takeMutation.mutate(scheduleId),
    release: (claimId: number) => releaseMutation.mutate(claimId),
    /** Pesan "keduluan" yang sedang ditampilkan; `null` bila tidak ada. */
    conflict,
    dismissConflict: () => setConflict(null),
    /** Ada mutasi berjalan — tombol dikunci agar tidak diklik dua kali. */
    busy: takeMutation.isPending || releaseMutation.isPending,
  };
}
