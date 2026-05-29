"use client";

import { useEffect, useState } from "react";

type NavItem = {
  id: string;
  label: string;
};

export function PageNav({ items, className }: { items: NavItem[]; className?: string }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const targets = items
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      className={[
        "page-nav hidden xl:flex flex-col gap-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Page sections"
    >
      {items.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={[
            "page-nav-item rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
            activeId === id
              ? "text-[var(--muted)] hover:text-[var(--foreground)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]",
          ].join(" ")}
          style={
            activeId === id
              ? { background: "var(--foreground)", color: "#ffffff" }
              : undefined
          }
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
