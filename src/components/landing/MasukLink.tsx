import { Link } from "@tanstack/react-router";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/buttonStyles";
import { LANDING_CTA } from "./content";

/**
 * Ajakan masuk ke aplikasi.
 *
 * Dirender sebagai **tautan**, bukan tombol yang memanggil `navigate`. Bedanya
 * nyata bagi pengunjung halaman depan: tautan bisa dibuka di tab baru, disalin
 * alamatnya, dan dibacakan pembaca layar sebagai sebuah tujuan — sedangkan
 * tombol hanya bisa ditekan. Bentuk visualnya tetap tombol, diambil dari
 * `buttonClasses` supaya sama persis dengan tombol di dalam aplikasi.
 */
export function MasukLink({
  size = "md",
  variant = "primary",
  className,
}: {
  size?: ButtonSize;
  /** `inverse` dipakai saat ajakan ini berdiri di atas latar ungu gelap. */
  variant?: ButtonVariant;
  className?: string;
}) {
  const { label, icon: Icon } = LANDING_CTA;

  return (
    <Link to="/login" className={buttonClasses(variant, size, className)}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
