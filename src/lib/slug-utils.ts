const CANONICAL_CITY_SLUG_ALIASES = {
  bialystok: ["bia-ystok"],
  lodz: ["odz"],
  wroclaw: ["wroc-aw"],
} as const;

const LEGACY_CITY_SLUG_TO_CANONICAL = Object.fromEntries(
  Object.entries(CANONICAL_CITY_SLUG_ALIASES).flatMap(([canonicalSlug, aliases]) =>
    aliases.map((alias) => [alias, canonicalSlug]),
  ),
) as Record<string, keyof typeof CANONICAL_CITY_SLUG_ALIASES>;

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
  const normalizedName = cityName ? normalizeTravelSlug(cityName) : "";
  const fixedSlug = LEGACY_CITY_SLUG_TO_CANONICAL[normalizedSlug];

  if (fixedSlug) {
    return fixedSlug;
  }

  if (normalizedName in CANONICAL_CITY_SLUG_ALIASES) {
    return normalizedName;
  }

  if (normalizedSlug) {
    return normalizedSlug;
  }

  return normalizedName;
}

export function buildCitySlugAliases(
  citySlug: string,
  cityName: string,
  extraAliases: string[] = [],
) {
  const canonicalSlug = getCanonicalCitySlug(citySlug, cityName);
  const legacyAliases = CANONICAL_CITY_SLUG_ALIASES[
    canonicalSlug as keyof typeof CANONICAL_CITY_SLUG_ALIASES
  ] ?? [];

  return new Set(
    [citySlug, cityName, canonicalSlug, ...legacyAliases, ...extraAliases]
      .map((candidate) => normalizeTravelSlug(candidate))
      .filter(Boolean),
  );
}
