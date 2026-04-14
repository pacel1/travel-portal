"use client";

import { useEffect, useRef } from "react";

interface ToursActivitiesWidgetProps {
  locale?: string;
}

function buildWidgetUrl(locale: string = "en"): string {
  const params = new URLSearchParams({
    currency: "USD",
    trs: "518488",
    shmarker: "719133",
    locale,
    category: "4",
    amount: "3",
    powered_by: "true",
    campaign_id: "137",
    promo_id: "4497",
  });

  return `https://tpwidg.com/content?${params.toString()}`;
}

export function ToursActivitiesWidget({
  locale = "en",
}: ToursActivitiesWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || containerRef.current.hasChildNodes()) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = buildWidgetUrl(locale);
    script.setAttribute("charset", "utf-8");
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [locale]);

  return (
    <div
      ref={containerRef}
      id="tp-tours-widget"
      style={{ overflow: "visible", position: "relative" }}
    />
  );
}
