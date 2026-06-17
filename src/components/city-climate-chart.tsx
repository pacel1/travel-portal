import type { CityMonthEntry } from "@/lib/city-catalog";
import type { LocaleCode } from "@/lib/i18n";

type CityClimateChartProps = {
  months: CityMonthEntry[];
  locale: LocaleCode;
};

const WIDTH = 720;
const HEIGHT = 280;
const PADDING = { top: 24, right: 16, bottom: 34, left: 36 };

const labels = {
  en: { day: "Day °C", night: "Night °C", rain: "Rainfall (mm)" },
  pl: { day: "Dzień °C", night: "Noc °C", rain: "Opady (mm)" },
  de: { day: "Tag °C", night: "Nacht °C", rain: "Regen (mm)" },
  es: { day: "Día °C", night: "Noche °C", rain: "Lluvia (mm)" },
  fr: { day: "Jour °C", night: "Nuit °C", rain: "Pluie (mm)" },
} as const;

function buildLinePoints(
  values: number[],
  min: number,
  max: number,
  plotWidth: number,
  plotHeight: number,
) {
  const span = max - min || 1;
  const step = plotWidth / Math.max(1, values.length - 1);

  return values
    .map((value, index) => {
      const x = PADDING.left + index * step;
      const y = PADDING.top + plotHeight - ((value - min) / span) * plotHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function CityClimateChart({ months, locale }: CityClimateChartProps) {
  const copy = labels[locale] ?? labels.en;
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const dayTemps = months.map((m) => m.climate.avgTempDay);
  const nightTemps = months.map((m) => m.climate.avgTempNight);
  const rainfall = months.map((m) => m.climate.rainfallMm);

  const tempMin = Math.floor(Math.min(...nightTemps) - 2);
  const tempMax = Math.ceil(Math.max(...dayTemps) + 2);
  const rainMax = Math.max(...rainfall, 10);

  const barStep = plotWidth / months.length;
  const barWidth = Math.max(6, barStep * 0.5);

  const dayPoints = buildLinePoints(dayTemps, tempMin, tempMax, plotWidth, plotHeight);
  const nightPoints = buildLinePoints(nightTemps, tempMin, tempMax, plotWidth, plotHeight);

  return (
    <figure className="ed-surface rounded-[1.5rem] p-4 sm:p-5">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${copy.day}, ${copy.night}, ${copy.rain}`}
      >
        {/* Rainfall bars */}
        {months.map((month, index) => {
          const barHeight = (month.climate.rainfallMm / rainMax) * plotHeight;
          const x = PADDING.left + index * barStep + (barStep - barWidth) / 2;
          const y = PADDING.top + plotHeight - barHeight;
          return (
            <rect
              key={`rain-${month.month}`}
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              width={barWidth.toFixed(1)}
              height={Math.max(0, barHeight).toFixed(1)}
              rx="2"
              fill="#5DA3D6"
              opacity="0.35"
            />
          );
        })}

        {/* Temperature lines */}
        <polyline
          points={nightPoints}
          fill="none"
          stroke="var(--accent-warm)"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={dayPoints}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Month labels */}
        {months.map((month, index) => {
          const x = PADDING.left + index * barStep + barStep / 2;
          return (
            <text
              key={`label-${month.month}`}
              x={x.toFixed(1)}
              y={HEIGHT - 12}
              textAnchor="middle"
              className="fill-[var(--muted)]"
              style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)" }}
            >
              {month.monthLabel.slice(0, 3)}
            </text>
          );
        })}
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-[var(--muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--accent)" }} />
          {copy.day}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--accent-warm)" }} />
          {copy.night}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#5DA3D6", opacity: 0.5 }} />
          {copy.rain}
        </span>
      </figcaption>
    </figure>
  );
}
