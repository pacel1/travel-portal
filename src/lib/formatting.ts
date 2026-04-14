import type { LocaleCode } from "@/lib/i18n";
import { defaultLocale } from "@/lib/i18n";

type MonthLabelForm = "standalone" | "afterPreposition";

const monthLabelsByLocale: Record<LocaleCode, Record<MonthLabelForm, Record<string, string>>> = {
  en: {
    standalone: {
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December",
    },
    afterPreposition: {
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December",
    },
  },
  de: {
    standalone: {
      january: "Januar",
      february: "Februar",
      march: "Marz",
      april: "April",
      may: "Mai",
      june: "Juni",
      july: "Juli",
      august: "August",
      september: "September",
      october: "Oktober",
      november: "November",
      december: "Dezember",
    },
    afterPreposition: {
      january: "Januar",
      february: "Februar",
      march: "Marz",
      april: "April",
      may: "Mai",
      june: "Juni",
      july: "Juli",
      august: "August",
      september: "September",
      october: "Oktober",
      november: "November",
      december: "Dezember",
    },
  },
  es: {
    standalone: {
      january: "enero",
      february: "febrero",
      march: "marzo",
      april: "abril",
      may: "mayo",
      june: "junio",
      july: "julio",
      august: "agosto",
      september: "septiembre",
      october: "octubre",
      november: "noviembre",
      december: "diciembre",
    },
    afterPreposition: {
      january: "enero",
      february: "febrero",
      march: "marzo",
      april: "abril",
      may: "mayo",
      june: "junio",
      july: "julio",
      august: "agosto",
      september: "septiembre",
      october: "octubre",
      november: "noviembre",
      december: "diciembre",
    },
  },
  fr: {
    standalone: {
      january: "janvier",
      february: "fevrier",
      march: "mars",
      april: "avril",
      may: "mai",
      june: "juin",
      july: "juillet",
      august: "aout",
      september: "septembre",
      october: "octobre",
      november: "novembre",
      december: "decembre",
    },
    afterPreposition: {
      january: "janvier",
      february: "fevrier",
      march: "mars",
      april: "avril",
      may: "mai",
      june: "juin",
      july: "juillet",
      august: "aout",
      september: "septembre",
      october: "octobre",
      november: "novembre",
      december: "decembre",
    },
  },
  pl: {
    standalone: {
      january: "styczeń",
      february: "luty",
      march: "marzec",
      april: "kwiecień",
      may: "maj",
      june: "czerwiec",
      july: "lipiec",
      august: "sierpień",
      september: "wrzesień",
      october: "październik",
      november: "listopad",
      december: "grudzień",
    },
    afterPreposition: {
      january: "styczniu",
      february: "lutym",
      march: "marcu",
      april: "kwietniu",
      may: "maju",
      june: "czerwcu",
      july: "lipcu",
      august: "sierpniu",
      september: "wrześniu",
      october: "październiku",
      november: "listopadzie",
      december: "grudniu",
    },
  },
};

const valueLabelsByLocale: Record<
  LocaleCode,
  {
    crowdLevel: Record<"low" | "medium" | "high", string>;
    priceLevel: Record<"low" | "medium" | "high", string>;
  }
> = {
  en: {
    crowdLevel: {
      low: "low",
      medium: "medium",
      high: "high",
    },
    priceLevel: {
      low: "low",
      medium: "medium",
      high: "high",
    },
  },
  de: {
    crowdLevel: {
      low: "niedrig",
      medium: "mittel",
      high: "hoch",
    },
    priceLevel: {
      low: "niedrig",
      medium: "mittel",
      high: "hoch",
    },
  },
  es: {
    crowdLevel: {
      low: "bajo",
      medium: "medio",
      high: "alto",
    },
    priceLevel: {
      low: "bajo",
      medium: "medio",
      high: "alto",
    },
  },
  fr: {
    crowdLevel: {
      low: "faible",
      medium: "moyen",
      high: "eleve",
    },
    priceLevel: {
      low: "faible",
      medium: "moyen",
      high: "eleve",
    },
  },
  pl: {
    crowdLevel: {
      low: "mały",
      medium: "umiarkowany",
      high: "duży",
    },
    priceLevel: {
      low: "niskie",
      medium: "umiarkowane",
      high: "wysokie",
    },
  },
};

const poiCategoryLabelsByLocale: Record<LocaleCode, Record<string, string>> = {
  en: {
    landmark: "landmark",
    museum: "museum",
    park: "park",
  },
  de: {
    landmark: "wahrzeichen",
    museum: "museum",
    park: "park",
  },
  es: {
    landmark: "monumento",
    museum: "museo",
    park: "parque",
  },
  fr: {
    landmark: "monument",
    museum: "musee",
    park: "parc",
  },
  pl: {
    landmark: "zabytek",
    museum: "muzeum",
    park: "park",
  },
};

const countryLabelsByLocale: Record<LocaleCode, Record<string, string>> = {
  en: {
    France: "France",
    Germany: "Germany",
    Italy: "Italy",
    Poland: "Poland",
  },
  de: {
    France: "Frankreich",
    Germany: "Deutschland",
    Italy: "Italien",
    Poland: "Polen",
  },
  es: {
    France: "Francia",
    Germany: "Alemania",
    Italy: "Italia",
    Poland: "Polonia",
  },
  fr: {
    France: "France",
    Germany: "Allemagne",
    Italy: "Italie",
    Poland: "Pologne",
  },
  pl: {
    France: "Francja",
    Germany: "Niemcy",
    Italy: "Włochy",
    Poland: "Polska",
  },
};

const scoreLabelsByLocale: Record<
  LocaleCode,
  {
    excellent: string;
    veryGood: string;
    solid: string;
    mixed: string;
    selective: string;
  }
> = {
  en: {
    excellent: "Prime Time",
    veryGood: "Great Choice",
    solid: "Good Option",
    mixed: "Plan Carefully",
    selective: "Only If It Fits",
  },
  de: {
    excellent: "Beste Reisezeit",
    veryGood: "Sehr gute Wahl",
    solid: "Gute Wahl",
    mixed: "Planung nötig",
    selective: "Nur wenn passend",
  },
  es: {
    excellent: "Momento ideal",
    veryGood: "Muy buena opción",
    solid: "Buena opción",
    mixed: "Requiere planificación",
    selective: "Solo si encaja",
  },
  fr: {
    excellent: "Période idéale",
    veryGood: "Très bon choix",
    solid: "Bon choix",
    mixed: "À planifier",
    selective: "Seulement si adapté",
  },
  pl: {
    excellent: "Idealny moment",
    veryGood: "Bardzo dobry wybór",
    solid: "Dobry wybór",
    mixed: "Wymaga planowania",
    selective: "Tylko jeśli pasuje",
  },
};
const scoreHooksByLocale: Record<
  LocaleCode,
  {
    excellent: string;
    veryGood: string;
    solid: string;
  }
> = {
  en: {
    excellent: "Easy yes for a strong shortlist",
    veryGood: "Worth considering with light planning",
    solid: "More selective than universally easy",
  },
  de: {
    excellent: "Leichtes Ja fur eine starke Shortlist",
    veryGood: "Mit etwas Planung gut machbar",
    solid: "Eher selektiv als universal leicht",
  },
  es: {
    excellent: "Un si facil para una shortlist fuerte",
    veryGood: "Vale la pena con algo de planificacion",
    solid: "Mas selectivo que universalmente facil",
  },
  fr: {
    excellent: "Un oui facile pour une shortlist forte",
    veryGood: "Vaut le coup avec un peu d'organisation",
    solid: "Plus selectif qu'universellement simple",
  },
  pl: {
    excellent: "Jeden z najmocniejszych miesięcy na ten kierunek",
    veryGood: "Bardzo sensowny wybór przy lekkim planowaniu",
    solid: "Dobry, jeśli styl wyjazdu pasuje do warunków",
  },
};

export function formatMonthLabel(
  month: string,
  locale: LocaleCode = defaultLocale,
  form: MonthLabelForm = "standalone",
) {
  return (
    monthLabelsByLocale[locale][form][month] ??
    monthLabelsByLocale[locale].standalone[month] ??
    monthLabelsByLocale[defaultLocale].standalone[month] ??
    month
  );
}

export function formatCrowdLevel(
  level: "low" | "medium" | "high",
  locale: LocaleCode = defaultLocale,
) {
  return valueLabelsByLocale[locale].crowdLevel[level];
}

export function formatPriceLevel(
  level: "low" | "medium" | "high",
  locale: LocaleCode = defaultLocale,
) {
  return valueLabelsByLocale[locale].priceLevel[level];
}

export function formatPopulation(population: number, locale: LocaleCode = defaultLocale) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(population / 1_000_000);
}

export function formatPoiCategory(category: string, locale: LocaleCode = defaultLocale) {
  return poiCategoryLabelsByLocale[locale][category] ?? poiCategoryLabelsByLocale[defaultLocale][category] ?? category;
}

export function formatCountryName(country: string, locale: LocaleCode = defaultLocale) {
  return countryLabelsByLocale[locale][country] ?? countryLabelsByLocale[defaultLocale][country] ?? country;
}

export function formatScoreLabel(score: number, locale: LocaleCode = defaultLocale) {
  const labels = scoreLabelsByLocale[locale] ?? scoreLabelsByLocale[defaultLocale];

  if (score >= 80) {
    return labels.excellent;
  }

  if (score >= 68) {
    return labels.veryGood;
  }

  if (score >= 55) {
    return labels.solid;
  }

  if (score >= 45) {
    return labels.mixed;
  }

  return labels.selective;
}

export function formatScoreHook(score: number, locale: LocaleCode = defaultLocale) {
  const labels = scoreHooksByLocale[locale] ?? scoreHooksByLocale[defaultLocale];

  if (score >= 78) {
    return labels.excellent;
  }

  if (score >= 65) {
    return labels.veryGood;
  }

  return labels.solid;
}

export function formatCityMonthLabel(
  cityName: string,
  month: string,
  locale: LocaleCode = defaultLocale,
) {
  const monthLabel = formatMonthLabel(
    month,
    locale,
    locale === "pl" ? "afterPreposition" : "standalone",
  );

  switch (locale) {
    case "de":
      return `${cityName} im ${monthLabel}`;
    case "es":
    case "fr":
      return `${cityName} en ${monthLabel}`;
    case "pl":
      return `${cityName} ${getPolishMonthPreposition(monthLabel)} ${monthLabel}`;
    case "en":
    default:
      return `${cityName} in ${monthLabel}`;
  }
}

export function getPolishMonthPreposition(monthLabel: string) {
  return monthLabel.toLowerCase().startsWith("w") ? "we" : "w";
}

export function formatDaysLabel(days: number, locale: LocaleCode = defaultLocale) {
  if (locale === "pl") {
    if (days === 1) {
      return "dzień";
    }

    const mod10 = days % 10;
    const mod100 = days % 100;

    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
      return "dni";
    }

    return "dni";
  }

  return days === 1 ? "day" : "days";
}
