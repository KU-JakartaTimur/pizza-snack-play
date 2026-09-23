import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { indonesianMonthName } from "@/lib/date";
import { cn } from "@/lib/cn";
import { QUICK } from "@/lib/motion";

/**
 * Tombol "bulan sebelumnya / berikutnya" beserta label bulannya.
 *
 * Dipakai halaman Kelola Jadwal, Bulanan, dan Pilih Jadwal agar ketiganya
 * berperilaku sama. Labelnya meluncur searah perpindahan bulan — petunjuk
 * kecil bahwa waktu memang bergerak, bukan sekadar teks yang ditimpa.
 */
export function MonthNavigator({
  year,
  month,
  onShift,
  className,
  labelClassName,
}: {
  year: number;
  month: number;
  onShift: (delta: number) => void;
  className?: string;
  labelClassName?: string;
}) {
  const reduced = useReducedMotion();
  const label = `${indonesianMonthName(month)} ${year}`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onShift(-1)}
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        className={cn(
          "relative min-w-40 text-center font-semibold text-slate-900",
          labelClassName,
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            className="block"
            initial={reduced ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: -12 }}
            transition={{ duration: QUICK, ease: "easeOut" }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onShift(1)}
        aria-label="Bulan berikutnya"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
