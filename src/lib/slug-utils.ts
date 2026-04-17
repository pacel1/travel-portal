const CITY_SLUG_FIXES = {
  "wroc-aw": "wroclaw",
} as const;

function transliterateSpecialSlugCharacters(value: string) {
  return value
    .replace(/\u00C4/g, "Ae")
    .replace(/\u00D6/g, "Oe")
    .replace(/\u00DC/g, "Ue")
    .replace(/\u00E4/g, "ae")
    .replace(/\u00F6/g, "oe")
    .replace(/\u00FC/g, "ue")
    .replace(/\u00DF/g, "ss")
    .replace(/\u0141/g, "L")
    .replace(/\u0142/g, "l");
}

export function normalizeTravelSlug(value: string) {
  return transliterateSpecialSlugCharacters(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function normalizeTextForComparison(value: string) {
  return transliterateSpecialSlugCharacters(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getCanonicalCitySlug(citySlug: string, cityName?: string) {
  const normalizedSlug = normalizeTravelSlug(citySlug);
  const fixedSlug = CITY_SLUG_FIXES[normalizedSlug as keyof typeof CITY_SLUG_FIXES];

  if (fixedSlug) {
    return fixedSlug;
  }

  if (normalizedSlug) {
    return normalizedSlug;
  }

  return cityName ? normalizeTravelSlug(cityName) : normalizedSlug;
}

export function buildCitySlugAliases(
  citySlug: string,
  cityName: string,
  extraAliases: string[] = [],
) {
  return new Set(
    [citySlug, cityName, ...extraAliases, getCanonicalCitySlug(citySlug, cityName)]
      .map((candidate) => normalizeTravelSlug(candidate))
      .filter(Boolean),
  );
}
