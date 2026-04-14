"use client";

import Link from "next/link";
import { startTransition, useEffect, useEffectEvent, useState } from "react";

import { TripTimiScoreBadge } from "@/components/triptimi-score-ticket";

export type HomeFeaturedRotatorItem = {
  href: string;
  countryLabel: string;
  title: string;
  score: number;
  scoreLabel: string;
};

export function HomeFeaturedRotator({
  items,
  compact = false,
  labels,
}: {
  items: HomeFeaturedRotatorItem[];
  compact?: boolean;
  labels: {
    live: string;
    open: string;
  };
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  const advance = useEffectEvent(() => {
    startTransition(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    });
  });

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      advance();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [items.length]);

  if (!activeItem) {
    return null;
  }

  return (
    <div
      className={`home-featured-rotator${compact ? " home-featured-rotator-compact" : ""}`}
      aria-live="polite"
    >
      <Link href={activeItem.href} className="home-featured-rotator-link lift">
        <div className="home-featured-rotator-copy">
          <p className="home-featured-rotator-kicker">
            <span className="home-featured-rotator-live">{labels.live}</span>
            <span>{activeItem.countryLabel}</span>
          </p>
          <h3>{activeItem.title}</h3>
        </div>

        <div className="home-featured-rotator-meta">
          <TripTimiScoreBadge
            label={activeItem.scoreLabel}
            score={activeItem.score}
            className="home-featured-rotator-badge"
          />
          <span className="home-featured-rotator-open">{labels.open}</span>
        </div>
      </Link>

      {items.length > 1 ? (
        <div className="home-featured-rotator-dots" aria-label="Featured ideas">
          {items.map((item, index) => (
            <button
              key={item.href}
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              aria-label={item.title}
              aria-pressed={index === activeIndex}
              onClick={() => {
                startTransition(() => {
                  setActiveIndex(index);
                });
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
