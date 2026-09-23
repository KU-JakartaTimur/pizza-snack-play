import { useCallback, useState } from "react";
import { monthOf, todayInWib, yearOf } from "@/lib/date";

/** Bulan yang sedang dilihat, sebagai pasangan tahun + bulan (1–12). */
export interface YearMonth {
  year: number;
  month: number;
}

/**
 * Navigasi bulan yang dipakai bersama halaman Kelola Jadwal, Bulanan, dan
 * Pilih Jadwal.
 *
 * Menggeser bulan melewati batas tahun adalah satu-satunya alasan hook ini
 * ada: perhitungan itu sebelumnya disalin di tiga halaman, dengan perilaku
 * yang mudah lepas sinkron satu sama lain.
 */
export function useMonthNavigator(today: string = todayInWib()) {
  const [value, setValue] = useState<YearMonth>(() => ({
    year: yearOf(today),
    month: monthOf(today),
  }));

  /**
   * Geser sejumlah bulan; nilainya boleh negatif.
   *
   * Dihitung lewat indeks bulan sejak tahun nol supaya pergantian tahun
   * tertangani tanpa cabang khusus.
   */
  const shift = useCallback((delta: number) => {
    setValue((current) => {
      const index = current.year * 12 + (current.month - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });
  }, []);

  return { year: value.year, month: value.month, shift, set: setValue };
}
