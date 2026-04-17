"use client";

import { useEffect, useRef } from "react";

interface EsimWidgetProps {
  country: string;
  locale?: string;
}

function buildWidgetUrl(country: string): string {
  const params = new URLSearchParams({
    trs: "518488",
    shmarker: "719133",
    locale: "en",
    country,
    powered_by: "true",
    color_button: "#f2685f",
    color_focused: "#f2685f",
    secondary: "#FFFFFF",
    dark: "#11100f",
    light: "#FFFFFF",
    special: "#C4C4C4",
    border_radius: "5",
    plain: "false",
    no_labels: "true",
    promo_id: "8588",
    campaign_id: "541",
  });

  return `https://tpwidg.com/content?${params.toString()}`;
}

function getTitle(country: string, locale: string): string {
  return locale === "pl"
    ? `Kup eSIM przed wyjazdem do ${country}`
    : `Get an eSIM before your trip to ${country}`;
}

function getDescription(country: string, locale: string): string {
  return locale === "pl"
    ? `Porownaj pakiety danych do ${country} i ogarnij internet jeszcze przed wylotem.`
    : `Compare data plans for ${country} and sort your connection before you fly.`;
}

export function EsimWidget({
  country,
  locale = "en",
}: EsimWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || container.hasChildNodes()) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = buildWidgetUrl(country);
    script.setAttribute("charset", "utf-8");
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [country]);

  return (
    <section className="apple-panel rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7">
      <p className="eyebrow text-[var(--accent)]">Travel setup</p>
      <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight sm:text-[2rem]">
        {getTitle(country, locale)}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        {getDescription(country, locale)}
      </p>
      <div
        ref={containerRef}
        id="tp-esim-widget"
        className="mt-6 min-h-[20rem]"
        style={{ overflow: "visible", position: "relative" }}
      />
    </section>
  );
}
