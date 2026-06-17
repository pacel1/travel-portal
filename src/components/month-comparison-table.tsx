import Link from "next/link";

import type { CityMonthEntry } from "@/lib/city-catalog";
import { formatCrowdLevel, formatDaysLabel, formatPriceLevel } from "@/lib/formatting";
import type { LocaleCode } from "@/lib/i18n";
import { getScoreTicketToneClass } from "@/components/triptimi-score-ticket";

type MonthComparisonTableProps = {
  months: CityMonthEntry[];
  bestMonths: CityMonthEntry[];
  locale: LocaleCode;
};

const headerCopy = {
  en: {
    month: "Month",
    score: "Score",
    day: "Day",
    rain: "Rainfall",
    crowds: "Crowds",
    price: "Prices",
  },
  pl: {
    month: "Miesiąc",
    score: "Ocena",
    day: "Dzień",
    rain: "Opady",
    crowds: "Ruch",
    price: "Ceny",
  },
  de: { month: "Monat", score: "Score", day: "Tag", rain: "Regen", crowds: "Andrang", price: "Preise" },
  es: { month: "Mes", score: "Score", day: "Día", rain: "Lluvia", crowds: "Afluencia", price: "Precios" },
  fr: { month: "Mois", score: "Score", day: "Jour", rain: "Pluie", crowds: "Affluence", price: "Prix" },
} as const;

const signalTone = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-800",
} as const;

const priceTone = {
  low: "bg-sky-100 text-sky-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-fuchsia-100 text-fuchsia-800",
} as const;

export function MonthComparisonTable({
  months,
  bestMonths,
  locale,
}: MonthComparisonTableProps) {
  const copy = headerCopy[locale] ?? headerCopy.en;
  const bestMonthKeys = new Set(bestMonths.map((month) => month.month));

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-[var(--border)] bg-white">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            <th scope="col" className="px-4 py-3">{copy.month}</th>
            <th scope="col" className="px-4 py-3">{copy.score}</th>
            <th scope="col" className="px-4 py-3">{copy.day}</th>
            <th scope="col" className="px-4 py-3">{copy.rain}</th>
            <th scope="col" className="px-4 py-3">{copy.crowds}</th>
            <th scope="col" className="px-4 py-3">{copy.price}</th>
          </tr>
        </thead>
        <tbody>
          {months.map((month) => (
            <tr
              key={month.month}
              className={`border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--background)] ${
                bestMonthKeys.has(month.month) ? "bg-[var(--background)]" : ""
              }`}
            >
              <td className="px-4 py-3">
                <Link
                  href={month.href}
                  prefetch={false}
                  className="font-medium text-[var(--foreground)] no-underline hover:text-[var(--accent)]"
                >
                  {month.monthLabel}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`score-badge ${getScoreTicketToneClass(month.score)} inline-flex items-baseline rounded-full px-2.5 py-1 font-serif text-sm font-medium`}
                >
                  {month.score}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-[var(--foreground)]">
                {month.climate.avgTempDay}°C
              </td>
              <td className="px-4 py-3 font-mono text-[var(--muted)]">
                {month.climate.rainfallMm} mm
                <span className="ml-1 text-xs">
                  · {month.climate.rainyDays} {formatDaysLabel(month.climate.rainyDays, locale)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${signalTone[month.crowdLevel]}`}>
                  {formatCrowdLevel(month.crowdLevel, locale)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${priceTone[month.priceLevel]}`}>
                  {formatPriceLevel(month.priceLevel, locale)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
