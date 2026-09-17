import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Search, SearchX, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Spinner,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  addDays,
  formatIndonesianDate,
  indonesianMonthName,
  monthOf,
  todayInWib,
  yearOf,
} from "@/lib/date";
import { ITEM_TYPE_LABELS } from "@/lib/item-types";
import type { MenuHistoryMatchDto } from "@/types/schedule";

export const Route = createFileRoute("/_app/pencarian")({
  component: SearchPage,
});

/** Rentang cepat dalam hari, dihitung mundur dari hari ini. */
const QUICK_RANGES = [
  { label: "1 bulan", days: 30 },
  { label: "3 bulan", days: 90 },
  { label: "6 bulan", days: 180 },
  { label: "1 tahun", days: 365 },
] as const;

interface SearchParams {
  q: string;
  from: string;
  to: string;
}

/** Sorot setiap kemunculan `term` di dalam `text` (tanpa regex). */
function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;

  const haystack = text.toLowerCase();
  const needle = term.toLowerCase();
  const parts: ReactNode[] = [];

  let cursor = 0;
  let index = haystack.indexOf(needle, cursor);
  let key = 0;

  while (index !== -1) {
    if (index > cursor) parts.push(text.slice(cursor, index));
    parts.push(
      <mark
        key={key}
        className="rounded bg-amber-100 px-0.5 font-semibold text-amber-900"
      >
        {text.slice(index, index + needle.length)}
      </mark>,
    );
    key += 1;
    cursor = index + needle.length;
    index = haystack.indexOf(needle, cursor);
  }

  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function SearchPage() {
  const today = todayInWib();

  const [term, setTerm] = useState("");
  const [from, setFrom] = useState(() => addDays(todayInWib(), -180));
  const [to, setTo] = useState(today);
  const [submitted, setSubmitted] = useState<SearchParams | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const searchQuery = useQuery({
    queryKey: [
      "schedules",
      "search",
      submitted?.q,
      submitted?.from,
      submitted?.to,
    ],
    queryFn: () =>
      api.schedules.search(submitted!.q, submitted!.from, submitted!.to),
    enabled: submitted !== null,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const query = term.trim();
    if (!query) {
      setFormError("Masukkan kata kunci terlebih dahulu");
      return;
    }
    if (from > to) {
      setFormError("Tanggal awal tidak boleh melebihi tanggal akhir");
      return;
    }

    setFormError(null);
    setSubmitted({ q: query, from, to });
  };

  const applyQuickRange = (days: number) => {
    setFrom(addDays(today, -days));
    setTo(today);
  };

  // Kelompokkan hasil per bulan agar riwayat mudah dipindai.
  const grouped = useMemo(() => {
    const matches = searchQuery.data?.matches ?? [];
    const byMonth = new Map<string, MenuHistoryMatchDto[]>();

    for (const match of matches) {
      const key = `${yearOf(match.date)}-${String(monthOf(match.date)).padStart(2, "0")}`;
      const bucket = byMonth.get(key);
      if (bucket) bucket.push(match);
      else byMonth.set(key, [match]);
    }

    return [...byMonth.values()];
  }, [searchQuery.data]);

  const result = searchQuery.data;
  const highlightTerm = result?.query ?? "";

  return (
    <>
      <PageHeader
        title="Cari Menu"
        description="Telusuri kapan sebuah menu atau komponennya pernah dijadwalkan."
      />

      <Card className="mb-6">
        <CardHeader
          title="Kata kunci & rentang tanggal"
          description="Pencarian mencocokkan nama menu maupun komponennya (mis. jeruk, susu, nasi)."
        />

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <Field
            label="Kata kunci"
            hint="Tekan Enter atau klik Cari untuk memulai."
            error={formError ?? undefined}
          >
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="mis. jeruk"
              autoFocus
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dari tanggal">
              <Input
                type="date"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.target.value)}
              />
            </Field>
            <Field label="Sampai tanggal">
              <Input
                type="date"
                value={to}
                min={from}
                onChange={(event) => setTo(event.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Rentang cepat:</span>
            {QUICK_RANGES.map((range) => (
              <Button
                key={range.label}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => applyQuickRange(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={searchQuery.isFetching}>
              <Search className="h-4 w-4" />
              Cari
            </Button>
          </div>
        </form>
      </Card>

      {submitted === null && (
        <Card>
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title="Belum ada pencarian"
            description="Masukkan kata kunci di atas untuk melihat riwayat penyajian menu."
          />
        </Card>
      )}

      {searchQuery.isPending && submitted !== null && <Spinner label="Mencari…" />}

      {searchQuery.isError && (
        <Card>
          <p className="px-5 py-6 text-sm text-red-600">
            {searchQuery.error.message}
          </p>
        </Card>
      )}

      {result && (
        <>
          <p className="mb-4 text-sm text-slate-600">
            {result.totalMatches > 0 ? (
              <>
                Ditemukan{" "}
                <strong className="text-slate-900">
                  {result.totalMatches} hari
                </strong>{" "}
                yang cocok dengan{" "}
                <strong className="text-slate-900">“{result.query}”</strong>.
              </>
            ) : (
              <>
                Tidak ada jadwal yang cocok dengan{" "}
                <strong className="text-slate-900">“{result.query}”</strong>.
              </>
            )}
          </p>

          {result.totalMatches === 0 ? (
            <Card>
              <EmptyState
                icon={<SearchX className="h-8 w-8" />}
                title="Tidak ada hasil"
                description={`Tidak ada menu atau komponen bernama “${result.query}” pada rentang ${result.from} – ${result.to}. Coba perlebar rentang tanggal atau gunakan kata kunci lain.`}
              />
            </Card>
          ) : (
            <div className="space-y-6">
              {grouped.map((matches) => {
                const first = matches[0];
                return (
                  <Card key={first.date}>
                    <CardHeader
                      title={`${indonesianMonthName(monthOf(first.date))} ${yearOf(first.date)}`}
                      description={`${matches.length} hari`}
                    />
                    <ul className="divide-y divide-slate-100">
                      {matches.map((match) => (
                        <li
                          key={match.date}
                          className="flex flex-wrap items-start gap-4 px-5 py-3.5"
                        >
                          <div className="w-44 shrink-0">
                            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                              {match.dayName}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatIndonesianDate(match.date)}
                            </p>
                          </div>

                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <UtensilsCrossed className="h-4 w-4 shrink-0 text-emerald-600" />
                              <Highlight
                                text={match.menuName}
                                term={highlightTerm}
                              />
                            </p>

                            {match.matchedItems.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pl-6">
                                {match.matchedItems.map((item) => (
                                  <Badge key={item.name} tone="success">
                                    <Highlight
                                      text={item.name}
                                      term={highlightTerm}
                                    />
                                    <span className="text-emerald-600/70">
                                      · {ITEM_TYPE_LABELS[item.itemType]}
                                    </span>
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {match.notes && (
                              <p className="pl-6 text-xs text-slate-500">
                                Catatan: {match.notes}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
