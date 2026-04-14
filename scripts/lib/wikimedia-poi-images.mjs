const COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php";

const stopWords = new Set([
  "and",
  "der",
  "die",
  "das",
  "de",
  "des",
  "du",
  "for",
  "im",
  "la",
  "le",
  "les",
  "mit",
  "of",
  "the",
  "und",
  "von",
]);

const titleBlacklist = [
  "logo",
  "coat of arms",
  "coa",
  "map",
  "locator",
  "flag",
  "svg",
  "plan",
  "ticket",
];

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&[^;\s]+;/g, " ")
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toTokens(value) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopWords.has(token));
}

function htmlToText(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchQueries(poi) {
  const queries = [];
  const seen = new Set();
  const candidates = [
    `"${poi.name}" ${poi.cityName}`,
    `${poi.name} ${poi.cityName}`,
    poi.localizedName ? `"${poi.localizedName}" ${poi.cityName}` : null,
    poi.localizedName ? `${poi.localizedName} ${poi.cityName}` : null,
    poi.name,
    poi.localizedName,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    queries.push(candidate);
  }

  return queries;
}

async function searchCommonsFiles(query, limit = 5) {
  const url = new URL(COMMONS_API_URL);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: String(limit),
    gsrsearch: query,
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1200",
  }).toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Wikimedia Commons search failed with ${response.status} for query: ${query}`);
  }

  const data = await response.json();
  const pages = Array.isArray(data.query?.pages) ? data.query.pages : [];

  return pages
    .map((page) => {
      const imageInfo = page.imageinfo?.[0];

      if (!imageInfo) {
        return null;
      }

      return {
        title: page.title,
        url: imageInfo.url,
        thumbUrl: imageInfo.thumburl ?? imageInfo.url,
        width: imageInfo.width ?? null,
        height: imageInfo.height ?? null,
        mime: imageInfo.mime ?? "",
        sourcePageUrl: imageInfo.descriptionurl ?? "",
        extmetadata: imageInfo.extmetadata ?? {},
      };
    })
    .filter(Boolean);
}

function scoreCandidate(poi, candidate) {
  const title = normalizeText(candidate.title.replace(/^file:/i, ""));
  const poiTokens = toTokens(poi.name);
  const localizedTokens = poi.localizedName ? toTokens(poi.localizedName) : [];
  const cityTokens = toTokens(poi.cityName);
  const allPoiTokens = [...new Set([...poiTokens, ...localizedTokens])];
  const matchedPoiTokens = allPoiTokens.filter((token) => title.includes(token));
  const matchedCityTokens = cityTokens.filter((token) => title.includes(token));
  const normalizedPoiName = normalizeText(poi.name);
  const normalizedLocalizedName = normalizeText(poi.localizedName);
  const hasExactPoiName = normalizedPoiName && title.includes(normalizedPoiName);
  const hasExactLocalizedName =
    normalizedLocalizedName && title.includes(normalizedLocalizedName);
  const hasStrongMatch =
    hasExactPoiName ||
    hasExactLocalizedName ||
    matchedPoiTokens.length >= 2 ||
    (matchedPoiTokens.length >= 1 && matchedCityTokens.length >= 1);
  const isGenericPoi = allPoiTokens.length <= 1;

  let score = 0;

  if (!candidate.mime.startsWith("image/") || candidate.mime === "image/svg+xml") {
    return -1;
  }

  if (!hasStrongMatch) {
    return -1;
  }

  if (isGenericPoi && matchedCityTokens.length === 0 && !hasExactPoiName && !hasExactLocalizedName) {
    return -1;
  }

  if (titleBlacklist.some((fragment) => title.includes(fragment))) {
    score -= 30;
  }

  score += matchedPoiTokens.length * 24;
  score += matchedCityTokens.length * 10;

  if (hasExactPoiName) {
    score += 28;
  }

  if (hasExactLocalizedName) {
    score += 18;
  }

  if (candidate.extmetadata?.Assessments?.value?.includes("quality")) {
    score += 8;
  }

  if (candidate.extmetadata?.Restrictions?.value) {
    score -= 25;
  }

  if (!candidate.extmetadata?.LicenseShortName?.value) {
    score -= 20;
  }

  return score;
}

function toImageRecord(candidate) {
  const metadata = candidate.extmetadata ?? {};
  const author = htmlToText(metadata.Artist?.value || metadata.Credit?.value);
  const licenseName = htmlToText(
    metadata.LicenseShortName?.value || metadata.UsageTerms?.value || "",
  );

  return {
    source: "wikimedia-commons",
    sourcePageUrl: candidate.sourcePageUrl,
    fileTitle: candidate.title,
    imageUrl: candidate.url,
    thumbUrl: candidate.thumbUrl,
    width: candidate.width,
    height: candidate.height,
    author: author || "Wikimedia Commons contributor",
    licenseName: licenseName || null,
    licenseUrl: metadata.LicenseUrl?.value || null,
    attributionText: buildAttributionText(author, licenseName),
  };
}

function buildAttributionText(author, licenseName) {
  const parts = [];

  if (author) {
    parts.push(author);
  }

  parts.push("via Wikimedia Commons");

  if (licenseName) {
    parts.push(licenseName);
  }

  return parts.join(" · ");
}

export async function resolvePoiImageFromWikimedia(poi) {
  const searchQueries = buildSearchQueries(poi);
  let bestCandidate = null;
  let bestScore = -1;

  for (const query of searchQueries) {
    const candidates = await searchCommonsFiles(query);

    for (const candidate of candidates) {
      const score = scoreCandidate(poi, candidate);

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    if (bestScore >= 60) {
      break;
    }
  }

  if (!bestCandidate || bestScore < 40) {
    return null;
  }

  return {
    poiId: poi.id,
    matchScore: bestScore,
    ...toImageRecord(bestCandidate),
  };
}
