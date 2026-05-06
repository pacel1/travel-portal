import Image from "next/image";

import type { LocaleCode } from "@/lib/i18n";

export function TripTimiScoreTicket({
  label,
  locale,
  score,
  className,
}: {
  label: string;
  locale: LocaleCode;
  score: number;
  className?: string;
}) {
  return (
    <div className={joinClasses("score-ticket", getScoreTicketToneClass(score), className)}>
      <span className="score-ticket-side-label" aria-hidden="true">
        {getScoreSideLabel(locale)}
      </span>
      <div className="score-ticket-header">
        <div className="score-ticket-brand">
          <Image
            src="/logotriptimi.png"
            alt="TripTimi travel score logo"
            width={957}
            height={356}
            className="score-ticket-logo"
            sizes="144px"
          />
        </div>
      </div>
      <div className="score-ticket-rule" />
      <div className="score-ticket-body">
        <div className="score-ticket-score-group">
          <strong className="score-ticket-value">{score}</strong>
        </div>
        <span className="score-ticket-label">{label}</span>
      </div>
    </div>
  );
}

export function MiniTripTimiScoreTicket({
  label,
  locale,
  score,
  className,
}: {
  label: string;
  locale: LocaleCode;
  score: number;
  className?: string;
}) {
  return (
    <div
      className={joinClasses(
        "score-ticket score-ticket-compact",
        getScoreTicketToneClass(score),
        className,
      )}
    >
      <span className="score-ticket-side-label" aria-hidden="true">
        {getScoreSideLabel(locale)}
      </span>
      <div className="score-ticket-body">
        <strong className="score-ticket-value">{score}</strong>
        <span className="score-ticket-label">{label}</span>
      </div>
    </div>
  );
}

export function TripTimiScoreBadge({
  label,
  score,
  className,
}: {
  label: string;
  score: number;
  className?: string;
}) {
  return (
    <span className={joinClasses("score-badge", getScoreTicketToneClass(score), className)}>
      <strong className="score-badge-value">{score}</strong>
      <span className="score-badge-label">{label}</span>
    </span>
  );
}

function getScoreSideLabel(locale: LocaleCode) {
  const labels: Record<LocaleCode, string> = {
    en: "SCORE",
    de: "WERT",
    es: "NOTA",
    fr: "NOTE",
    pl: "OCENA",
  };

  return labels[locale];
}

export function getScoreTicketToneClass(score: number) {
  if (score >= 80) {
    return "score-ticket-prime";
  }

  if (score >= 68) {
    return "score-ticket-great";
  }

  if (score >= 55) {
    return "score-ticket-good";
  }

  if (score >= 45) {
    return "score-ticket-plan";
  }

  return "score-ticket-fit";
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}
