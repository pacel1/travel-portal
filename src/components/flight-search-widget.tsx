"use client";

import { useEffect, useRef } from "react";

interface FlightSearchWidgetProps {
  destination: string;
  locale?: string;
}

function buildWidgetUrl(destination: string, locale: string = "en"): string {
  const params = new URLSearchParams({
    currency: "eur",
    trs: "518488",
    shmarker: "719133",
    locale,
    stops: "any",
    show_hotels: "true",
    powered_by: "true",
    border_radius: "0",
    plain: "true",
    color_button: "%2300A991",
    color_button_text: "%23ffffff",
    promo_id: "3414",
    campaign_id: "111",
    destination,
  });

  return `https://tpwidg.com/content?${params.toString()}`;
}

function getTitle(destination: string, locale: string): string {
  return locale === "pl"
    ? `Wyszukaj loty do ${destination}`
    : `Search flights to ${destination}`;
}

export function FlightSearchWidget({
  destination,
  locale = "en",
}: FlightSearchWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || container.hasChildNodes()) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = buildWidgetUrl(destination, locale);
    script.setAttribute("charset", "utf-8");
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [destination, locale]);

  return (
    <section className="apple-panel rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7">
      <p className="eyebrow text-[var(--accent)]">Book your trip</p>
      <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight sm:text-[2rem]">
        {getTitle(destination, locale)}
      </h2>
      <div
        ref={containerRef}
        id="tp-widget"
        className="mt-6 min-h-[28rem]"
        style={{ overflow: "visible", position: "relative" }}
      />
    </section>
  );
}
