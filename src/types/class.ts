/** DTO daftar kelas — dipakai bersama oleh API dan frontend. */

export interface ClassListDto {
  /** Kelas yang boleh diakses user ini, urut abjad. */
  classes: string[];
  /**
   * Kelas yang dipakai bila klien tidak menyebut `class` secara eksplisit.
   * `null` bila user belum punya kelas sama sekali.
   */
  default: string | null;
}
