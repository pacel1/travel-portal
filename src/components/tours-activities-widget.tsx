"use client";

import { useEffect, useRef } from "react";

interface ToursActivitiesWidgetProps {
  tiqetsCityId: string;
}

function buildWidgetUrl(tiqetsCityId: string): string {
  const params = new URLSearchParams({
    currency: "USD",
    trs: "518488",
    shmarker: "719133",
    language: "en",
    locale: tiqetsCityId,
    layout: "horizontal",
    cards: "4",
    powered_by: "true",
    campaign_id: "89",
    promo_id: "3947",
  });

  return `https://tpwidg.com/content?${params.toString()}`;
}

export function ToursActivitiesWidget({
  tiqetsCityId,
}: ToursActivitiesWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || container.hasChildNodes()) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = buildWidgetUrl(tiqetsCityId);
    script.setAttribute("charset", "utf-8");
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [tiqetsCityId]);

  return (
    <div
      ref={containerRef}
      id="tp-tours-widget"
      style={{ overflow: "visible", position: "relative" }}
    />
  );
}
