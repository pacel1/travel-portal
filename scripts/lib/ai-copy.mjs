import OpenAI from "openai";

import { defaultLocale } from "./locales.mjs";
import { buildPageCopyKey } from "./page-copy-sync.mjs";

const AI_COPY_PROMPT_VERSION = "travel-copy-v8";
const DEFAULT_SOURCE_MODEL = "gpt-5.4-mini";
const DEFAULT_TRANSLATION_MODEL = "gpt-5.4-nano";
const DEFAULT_SOURCE_CONCURRENCY = 4;
const DEFAULT_TRANSLATION_CONCURRENCY = 6;
const DEFAULT_SOURCE_MAX_CONCURRENCY = 4;
const DEFAULT_TRANSLATION_MAX_CONCURRENCY = 8;
const BATCH_P95_SLOW_MS = 20_000;
const BATCH_P95_FAST_MS = 8_000;
const GOOD_BATCH_STREAK_FOR_SCALE_UP = 3;
const EXTENDED_PROMPT_CACHE_MODELS = new Set([
  "gpt-5.4",
  "gpt-5.2",
  "gpt-5.1",
  "gpt-5.1-codex",
  "gpt-5.1-codex-mini",
  "gpt-5.1-chat-latest",
  "gpt-5",
  "gpt-5-codex",
  "gpt-4.1",
]);

const MODEL_PRICING_BY_MILLION = {
  "gpt-5.4": {
    input: 2.5,
    cachedInput: 0.25,
    output: 15,
  },
  "gpt-5.4-mini": {
    input: 0.75,
    cachedInput: 0.075,
    output: 4.5,
  },
  "gpt-5.4-nano": {
    input: 0.2,
    cachedInput: 0.02,
    output: 1.25,
  },
};

const RAW_FIELD_MAX_LENGTHS = {
  summary: 280,
  verdictHeading: 300,
  monthRead: 280,
  bookingRead: 280,
};

const NORMALIZED_FIELD_MAX_LENGTHS = {
  ...RAW_FIELD_MAX_LENGTHS,
};

const localeInstructions = {
  en: "Write in English.",
  de: "Write in natural German for German-speaking travelers.",
  es: "Write in natural Spanish for Spanish-speaking travelers.",
  fr: "Write in natural French for French-speaking travelers.",
  pl: "Write in natural Polish for Polish-speaking travelers.",
};

const localeNames = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  pl: "Polish",
};

const localeStyleNotes = {
  en: "",
  de:
    "Prefer idiomatic travel-editorial phrasing over literal translation. Never mention internal score labels, Punktzahl, quoted verdict tags, or framing such as 'Das Fazit lautet'. Never leave English phrases like 'city break', 'low crowds', 'low prices', 'works best', or 'if you want' in the final text.",
  es:
    "Prefer idiomatic travel-editorial phrasing over literal translation. Never mention puntuacion, notas, quoted verdict tags, or internal score framing. Never leave English phrases like 'city break', 'low crowds', 'low prices', 'works best', or 'if you want' in the final text.",
  fr:
    "Prefer idiomatic travel-editorial phrasing over literal translation. Never mention note, score, quoted verdict tags, or internal score framing. Never leave English phrases like 'city break', 'low crowds', 'low prices', 'works best', or 'if you want' in the final text.",
  pl:
    "Prefer idiomatic travel-editorial phrasing over literal translation. Never use awkward calques like 'zabezpieczyc nocleg', 'zablokowac atrakcje', 'solidny' as a travel verdict, 'shortlista', 'landmark', or stiff noun-plus-adjective constructions such as 'wysokie tlumy'. Favor natural phrasing like 'zarezerwowac nocleg', 'warto rozwazyc', 'dobry moment', 'duzy ruch', 'glowne atrakcje', 'najwazniejsze zabytki', and sentences that sound like a local travel editor. Avoid broken constructions with sunshine hours; write 'jest okolo 12 godzin slonca' or rephrase naturally.",
};

const SOURCE_SYSTEM_PROMPT = [
  "You write concise, natural travel copy for SEO landing pages.",
  "Use only the provided facts and never invent neighborhoods, events, weather, prices, or seasonal claims.",
  "Keep the tone helpful, specific, and human.",
  "Avoid template phrases and generic filler.",
  "Every sentence must land cleanly and read as finished editorial copy, never as a clipped fragment.",
  "Return valid JSON matching the provided schema.",
].join(" ");

const TRANSLATION_SYSTEM_PROMPT = [
  "You localize structured travel copy into the target language.",
  "Preserve the meaning, editorial hierarchy, and intent of the English source JSON.",
  "Keep the output faithful to the source while using natural local phrasing.",
  "Use the supplied facts only as guardrails for factual consistency, not as a license to rewrite the content from scratch.",
  "Every sentence must land cleanly and read as finished editorial copy, never as a clipped fragment.",
  "Return valid JSON matching the provided schema.",
].join(" ");

function createClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env.local before generating AI copy.");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getBooleanEnv(name, defaultValue = false) {
  const value = process.env[name];

  if (value == null || value === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function getGenerationMode(locale) {
  return locale === defaultLocale ? "source" : "translation";
}

function getModelForLocale(locale) {
  if (process.env.OPENAI_COPY_MODEL) {
    return process.env.OPENAI_COPY_MODEL;
  }

  return getGenerationMode(locale) === "source"
    ? process.env.OPENAI_COPY_MODEL_SOURCE ?? DEFAULT_SOURCE_MODEL
    : process.env.OPENAI_COPY_MODEL_TRANSLATION ?? DEFAULT_TRANSLATION_MODEL;
}

function getPromptCacheKey(locale) {
  const mode = getGenerationMode(locale);
  return `travel-copy:${mode}:${locale}:${AI_COPY_PROMPT_VERSION}`;
}

function getPromptCacheRetention(model) {
  return EXTENDED_PROMPT_CACHE_MODELS.has(model) ? "24h" : "in_memory";
}

function getCopySchema() {
  return {
    type: "object",
    properties: {
      summary: {
        type: "string",
        minLength: 70,
        maxLength: RAW_FIELD_MAX_LENGTHS.summary,
      },
      verdictHeading: {
        type: "string",
        minLength: 80,
        maxLength: RAW_FIELD_MAX_LENGTHS.verdictHeading,
      },
      pros: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "string",
          minLength: 18,
          maxLength: 140,
        },
      },
      cons: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "string",
          minLength: 18,
          maxLength: 140,
        },
      },
      recommendations: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "string",
          minLength: 24,
          maxLength: 180,
        },
      },
      tips: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "string",
          minLength: 18,
          maxLength: 180,
        },
      },
      bestFor: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "string",
          minLength: 32,
          maxLength: 180,
        },
      },
      monthRead: {
        type: "string",
        minLength: 70,
        maxLength: RAW_FIELD_MAX_LENGTHS.monthRead,
      },
      bookingRead: {
        type: "string",
        minLength: 70,
        maxLength: RAW_FIELD_MAX_LENGTHS.bookingRead,
      },
    },
    required: [
      "summary",
      "verdictHeading",
      "pros",
      "cons",
      "recommendations",
      "tips",
      "bestFor",
      "monthRead",
      "bookingRead",
    ],
    additionalProperties: false,
  };
}

function takeTopAttractions(items, limit = 3) {
  return items
    .slice(0, limit)
    .map((item) => ({
      name: item.name,
      category: item.category,
      popularityScore: item.popularityScore,
    }));
}

function takeTopLinks(items, limit = 3) {
  return items.slice(0, limit).map((item) => ({
    label: item.label,
    score: item.score,
  }));
}

function buildContentStrategy(page) {
  const wetMonth = page.climate.rainfallMm >= 70 || page.climate.rainyDays >= 10;
  const budgetMonth = page.travelSignals.priceLevel === "low";
  const quietMonth = page.travelSignals.crowdLevel === "low";
  const indoorMonth =
    page.attractions.indoor.length >= page.attractions.outdoor.length ||
    wetMonth ||
    page.climate.avgTempDay <= 10;
  const tier = page.score >= 80 ? "strong" : page.score >= 65 ? "balanced" : "selective";

  let primaryAngle = "balanced";
  let readerIntent = "general city-break decision";

  if (tier === "selective" && budgetMonth) {
    primaryAngle = "budget";
    readerIntent = "value-first trip with acceptable tradeoffs";
  } else if (tier === "selective" && quietMonth) {
    primaryAngle = "quiet";
    readerIntent = "calmer sightseeing over peak-season buzz";
  } else if (tier === "selective" && indoorMonth) {
    primaryAngle = "indoor";
    readerIntent = "museum-led or indoor-heavy city break";
  } else if (tier === "strong") {
    primaryAngle = "easy_yes";
    readerIntent = "broadly easy month to recommend";
  } else if (budgetMonth) {
    primaryAngle = "value";
    readerIntent = "balanced trip with decent value";
  } else if (quietMonth) {
    primaryAngle = "quiet";
    readerIntent = "balanced trip with lighter crowd pressure";
  }

  return {
    tier,
    primaryAngle,
    readerIntent,
    wetMonth,
    budgetMonth,
    quietMonth,
    indoorMonth,
    comparisonFocus:
      tier === "selective"
        ? "be honest about stronger alternative months or nearby cities"
        : "mention alternatives only when they add decision value",
  };
}

function makePromptFacts(page) {
  const totalAttractions = page.attractions.outdoor.length + page.attractions.indoor.length;

  return {
    city: page.cityName,
    country: page.country,
    month: page.month,
    score: page.score,
    scoreLabel: page.scoreLabel,
    climate: {
      avgTempDay: page.climate.avgTempDay,
      avgTempNight: page.climate.avgTempNight,
      rainfallMm: page.climate.rainfallMm,
      rainyDays: page.climate.rainyDays,
      sunshineHours: page.climate.sunshineHours,
    },
    travelSignals: {
      crowdLevel: page.travelSignals.crowdLevel,
      priceLevel: page.travelSignals.priceLevel,
    },
    attractionSummary: {
      totalShown: totalAttractions,
      outdoorShown: page.attractions.outdoor.length,
      indoorShown: page.attractions.indoor.length,
    },
    outdoorHighlights: takeTopAttractions(page.attractions.outdoor),
    indoorHighlights: takeTopAttractions(page.attractions.indoor),
    bestAlternativeMonths: takeTopLinks(page.internalLinks.sameCity),
    nearbyAlternatives: takeTopLinks(page.internalLinks.similarCities),
    contentStrategy: buildContentStrategy(page),
  };
}

function makeSourceCopy(page, sourceCopy) {
  const resolvedSource = sourceCopy ?? {};
  const resolvedVerdict = resolvedSource.verdict ?? page.verdict;
  const resolvedEditorial = resolvedSource.editorial ?? page.editorial ?? {};

  return {
    summary: resolvedSource.summary ?? page.summary,
    verdictHeading: resolvedVerdict?.heading ?? page.verdict?.heading ?? "",
    pros: resolvedVerdict?.pros ?? page.verdict?.pros ?? [],
    cons: resolvedVerdict?.cons ?? page.verdict?.cons ?? [],
    recommendations: resolvedSource.recommendations ?? page.recommendations ?? [],
    tips: resolvedSource.tips ?? page.tips ?? [],
    bestFor: resolvedEditorial?.bestFor ?? [],
    monthRead: resolvedEditorial?.monthRead ?? "",
    bookingRead: resolvedEditorial?.bookingRead ?? "",
  };
}

function buildSystemPrompt(locale, mode) {
  const styleNote = localeStyleNotes[locale] ? ` ${localeStyleNotes[locale]}` : "";
  const localeInstruction = localeInstructions[locale] ?? localeInstructions[defaultLocale];
  const basePrompt = mode === "translation" ? TRANSLATION_SYSTEM_PROMPT : SOURCE_SYSTEM_PROMPT;

  return `${basePrompt} ${localeInstruction}${styleNote}`.trim();
}

function buildSourceUserPrompt(facts) {
  const strategy = facts.contentStrategy ?? {};

  return [
    "Task: generate fresh travel copy from the facts JSON below.",
    "Requirements:",
    "- summary: exactly 2 complete sentences and under 220 characters",
    "- verdictHeading: exactly 2 complete sentences and under 220 characters total",
    "- pros, cons, recommendations, tips, bestFor: 2 to 3 items each",
    "- monthRead and bookingRead: exactly 2 complete sentences each and under 225 characters",
    "- Keep every field specific to this city and month",
    "- Lead with traveler-relevant conditions, not internal scoring language",
    '- Do not mention "verdict", "score label", or quoted internal labels',
    "- Avoid formulaic openings like 'City in Month scores...' or 'is rated...'",
    "- Mention crowds and prices only when they materially shape the trip",
    "- Mention weather and attraction strength in the verdict",
    "- Avoid hype and reusable travel-template phrasing",
    "- Every sentence must feel complete; never end on a clipped noun, adjective, or dangling phrase",
    "- Match the traveler intent in contentStrategy instead of forcing every page into a generic 'best time' frame",
    ...(strategy.tier === "selective"
      ? [
          "- Treat this as a selective opportunity page, not a failed peak-season page",
          "- Make it clear who this month still suits and what compensating upside makes it worth considering",
          "- Lean into budget, quieter sightseeing, indoor strengths, or flexibility when the facts support it",
          "- Be honest about tradeoffs and mention stronger alternatives when useful",
        ]
      : []),
    ...(strategy.tier === "strong"
      ? [
          "- Explain why the month is easy to say yes to without sounding like generic peak-season hype",
        ]
      : []),
    "",
    "Content strategy JSON:",
    JSON.stringify(strategy),
    "",
    "Facts JSON:",
    JSON.stringify(facts),
  ].join("\n");
}

function buildTranslationUserPrompt(sourceCopy, facts, locale) {
  const strategy = facts.contentStrategy ?? {};

  return [
    `Task: translate and localize the English source JSON into natural ${localeNames[locale]}.`,
    "Requirements:",
    "- Preserve the meaning and structure of every source field",
    "- Keep all arrays aligned with the source JSON shape",
    "- Recommendations, tips, and editorial fields should stay semantically aligned with the source, not be rewritten from scratch",
    "- Use the facts JSON only to avoid factual drift or awkward wording",
    "- Preserve the source page's traveler-intent angle, including any selective, budget, quiet, indoor, or tradeoff framing",
    "- Keep the verdict concise, editorial, and specific",
    "- Translate every sentence and clause into the target language; never leave English framing or mixed-language output behind",
    "- Never mention explicit score points, quoted verdict labels, or internal ranking wording in the localized copy",
    "- Do not introduce internal SEO wording, scoring jargon, or quoted labels that are not needed for a human reader",
    "- Polish must use natural diacritics and idiomatic travel language, not literal calques or ASCII fallback text",
    "- Every sentence must feel complete; never end on a clipped noun, adjective, or dangling phrase",
    "- Keep summary under 220 characters, verdictHeading under 220 characters, and monthRead and bookingRead under 225 characters",
    "",
    "Content strategy JSON:",
    JSON.stringify(strategy),
    "",
    "Source JSON:",
    JSON.stringify(sourceCopy),
    "",
    "Facts guardrails JSON:",
    JSON.stringify(facts),
  ].join("\n");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableCopyError(error) {
  if (!error) {
    return false;
  }

  const status = error.status;
  const code = error.code;
  const causeCode = error.cause?.code;
  const message = error.message ?? "";

  return (
    error instanceof SyntaxError ||
    status === 408 ||
    status === 409 ||
    status === 429 ||
    status >= 500 ||
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND" ||
    causeCode === "ETIMEDOUT" ||
    causeCode === "ECONNRESET" ||
    causeCode === "ENOTFOUND" ||
    /connection error/i.test(message) ||
    /fetch failed/i.test(message) ||
    /AI copy payload ended with an incomplete sentence/i.test(message) ||
    /AI copy field .+ is too long after normalization/i.test(message) ||
    /AI copy verdict heading is too long/i.test(message) ||
    /AI copy quality check failed/i.test(message) ||
    /AI verdict repair returned an incomplete heading/i.test(message) ||
    /Unexpected end of JSON input/i.test(message) ||
    /Unterminated string in JSON/i.test(message) ||
    /JSON/i.test(message)
  );
}

function isConcurrencyReductionError(error) {
  if (!error) {
    return false;
  }

  const status = error.status;
  const code = error.code;
  const causeCode = error.cause?.code;

  return (
    status === 429 ||
    status === 408 ||
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND" ||
    causeCode === "ETIMEDOUT" ||
    causeCode === "ECONNRESET" ||
    causeCode === "ENOTFOUND"
  );
}

function looksCompleteSentence(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  return /[.!?]["')]*$/.test(trimmed);
}

function ensureTerminalPunctuation(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (looksCompleteSentence(trimmed)) {
    return trimmed;
  }

  return `${trimmed}.`;
}

function cleanBasicTextArtifacts(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/\s+/g, " ")
    .replace(/,\s*([.!?])/g, "$1")
    .replace(/\.\.+/g, ".")
    .trim();
}

function sanitizeGermanGeneratedText(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/\bcity breaks?\b/gi, "Stadtereise")
    .replace(/\blow crowds?\b/gi, "wenig Andrang")
    .replace(/\blow prices?\b/gi, "niedrige Preise")
    .replace(/\bworks best\b/gi, "funktioniert am besten")
    .replace(/\bif you want\b/gi, "wenn Sie moechten")
    .replace(/\btravelers?\b/gi, "Reisende")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeSpanishGeneratedText(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/\bcity breaks?\b/gi, "escapada urbana")
    .replace(/\blow crowds?\b/gi, "poca afluencia")
    .replace(/\blow prices?\b/gi, "precios bajos")
    .replace(/\bworks best\b/gi, "funciona mejor")
    .replace(/\btravelers?\b/gi, "viajeros")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeFrenchGeneratedText(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/\bcity breaks?\b/gi, "escapade urbaine")
    .replace(/\blow crowds?\b/gi, "faible affluence")
    .replace(/\blow prices?\b/gi, "prix bas")
    .replace(/\bworks best\b/gi, "fonctionne le mieux")
    .replace(/\btravelers?\b/gi, "voyageurs")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizePolishGeneratedText(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/\bcity breaks?\b/gi, "wyjazd miejski")
    .replace(/\bmust see\b/gi, "najważniejsze miejsca")
    .replace(/\btopowo ocenianych\b/gi, "najlepiej ocenianych")
    .replace(/\btopow[eychaoi]*\b/gi, "najważniejsze")
    .replace(/\bmoc zwiedzania\b/gi, "potencjał zwiedzania")
    .replace(/\bdo ogarnięcia\b/gi, "łatwiejszy do zaplanowania")
    .replace(/\bindoor-first\b/gi, "z przewagą atrakcji pod dachem")
    .replace(/\bwypada bardzo dobrze\b/gi, "jest bardzo dobrym wyborem")
    .replace(/\bnotuje (\d+) punkt(y|ów)?\b/gi, "osiąga $1 punktów")
    .replace(/\bzdobywa (\d+) punkt(y|ów)?\b/gi, "osiąga $1 punktów")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArrayItems(items = []) {
  return items.map((item) => cleanBasicTextArtifacts(item));
}

function normalizeLocaleText(value, locale) {
  const cleaned = cleanBasicTextArtifacts(value);

  switch (locale) {
    case "de":
      return sanitizeGermanGeneratedText(cleaned);
    case "es":
      return sanitizeSpanishGeneratedText(cleaned);
    case "fr":
      return sanitizeFrenchGeneratedText(cleaned);
    case "pl":
      return sanitizePolishGeneratedText(cleaned);
    case "en":
    default:
      return cleaned;
  }
}

function normalizeAiCopyPayload(payload, locale = defaultLocale) {
  return {
    ...payload,
    summary: ensureTerminalPunctuation(normalizeLocaleText(payload.summary, locale)),
    verdictHeading: ensureTerminalPunctuation(normalizeLocaleText(payload.verdictHeading, locale)),
    pros: normalizeArrayItems(payload.pros).map((item) => normalizeLocaleText(item, locale)),
    cons: normalizeArrayItems(payload.cons).map((item) => normalizeLocaleText(item, locale)),
    recommendations: normalizeArrayItems(payload.recommendations).map((item) =>
      normalizeLocaleText(item, locale),
    ),
    tips: normalizeArrayItems(payload.tips).map((item) => normalizeLocaleText(item, locale)),
    bestFor: normalizeArrayItems(payload.bestFor).map((item) => normalizeLocaleText(item, locale)),
    monthRead: ensureTerminalPunctuation(normalizeLocaleText(payload.monthRead, locale)),
    bookingRead: ensureTerminalPunctuation(normalizeLocaleText(payload.bookingRead, locale)),
  };
}

function normalizeVerdictHeading(value, locale = defaultLocale) {
  return ensureTerminalPunctuation(normalizeLocaleText(value, locale));
}

const ENGLISH_LEAK_PATTERNS_BY_LOCALE = {
  de: [
    /\bis a\b/i,
    /\bif you\b/i,
    /\bexpect\b/i,
    /\blow crowds?\b/i,
    /\blow prices?\b/i,
    /\bworks best\b/i,
    /\bcity breaks?\b/i,
    /\btravelers?\b/i,
    /\bbook your\b/i,
  ],
  es: [
    /\bis a\b/i,
    /\bif you\b/i,
    /\bexpect\b/i,
    /\blow crowds?\b/i,
    /\blow prices?\b/i,
    /\bworks best\b/i,
    /\bcity breaks?\b/i,
    /\btravelers?\b/i,
    /\bbook your\b/i,
  ],
  fr: [
    /\bis a\b/i,
    /\bif you\b/i,
    /\bexpect\b/i,
    /\blow crowds?\b/i,
    /\blow prices?\b/i,
    /\bworks best\b/i,
    /\bcity breaks?\b/i,
    /\btravelers?\b/i,
    /\bbook your\b/i,
  ],
  pl: [
    /\bis a\b/i,
    /\bif you\b/i,
    /\bexpect\b/i,
    /\blow crowds?\b/i,
    /\blow prices?\b/i,
    /\bworks best\b/i,
    /\bcity breaks?\b/i,
    /\btravelers?\b/i,
    /\bbook your\b/i,
  ],
};

const INTERNAL_SCORE_PATTERNS_BY_LOCALE = {
  de: [/\berreicht insgesamt \d+/i, /\b\d+\s+Punkte\b/i, /\bDas Fazit lautet\b/i],
  es: [/\bobtiene (?:una )?(?:puntuacion|puntuaci\u00f3n|nota) /i, /\b\d+\/100\b/i],
  fr: [/\bobtient (?:un )?(?:score|une note) /i, /\b\d+\/100\b/i],
  pl: [/\bwyniki?em \d+\/100\b/i, /\bwynosi \d+\/100\b/i, /\bocena miesiaca wynosi\b/i],
};

const SUSPICIOUS_TAIL_PATTERNS_BY_LOCALE = {
  de: [/\bMuseum\.$/i, /\bu\.$/i, /\b(die|der|das|den|dem|des)\.$/i],
  es: [/\bMuseo\.$/i, /\bcub\.$/i, /\b(inter|exter)\.$/i],
  fr: [/\bMusee\.$/i, /\bmusee\.$/i, /\baccep[\p{L}\p{M}\u00ad]*\.$/iu],
  pl: [
    /\bbez\.$/i,
    /\bzbud\.$/i,
    /\bNarod\.$/i,
    /\bkomplet\.$/i,
    /\bsredn\.$/i,
    /\bśredn\.$/i,
    /\bmaksymalnym\.$/i,
    /\bzewną\.$/i,
    /\bpres\.$/i,
    /\bz\.$/i,
  ],
};

function countPatternMatches(text, patterns = []) {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function hasGenericBrokenTail(text) {
  return /\p{L}{2,}-\.$/u.test((text ?? "").trim());
}

function hasSuspiciousTailForLocale(text, locale) {
  return countPatternMatches(text, SUSPICIOUS_TAIL_PATTERNS_BY_LOCALE[locale] ?? []) >= 1;
}

function getFinalToken(text) {
  const trimmed = (text ?? "").trim();
  const match = trimmed.match(/([\p{L}\p{M}\d\u00ad-]+)[.!?]["')»”]*$/u);
  return match?.[1] ?? "";
}

function hasUnbalancedEditorialQuotes(text) {
  const matches = (text ?? "").match(/[„”“"]/g) ?? [];
  return matches.length % 2 === 1;
}

function hasSuspiciousDashEnding(text) {
  return /[—-]\.$/u.test((text ?? "").trim());
}

function hasSuspiciousFinalToken(text, locale) {
  const token = getFinalToken(text);

  if (!token) {
    return false;
  }

  if (/\d/.test(token) || /\u00ad/u.test(token)) {
    return true;
  }

  if (locale === "pl") {
    return /^(musz|zewną|pres|narod|komplet|bez|zbud|sredn|średn|maksymalnym|na|c)$/i.test(
      token,
    );
  }

  if (locale === "de") {
    return /^(die|der|das|den|dem|des|eine\d*)$/i.test(token);
  }

  if (locale === "es") {
    return /^(o|cub|wroc|inter|exter)$/i.test(token);
  }

  if (locale === "fr") {
    return /^(a|à|accep[\p{L}\p{M}\u00ad]*)$/iu.test(token);
  }

  return false;
}

function getCopyQualityIssues(payload, locale, facts = null) {
  const combinedText = [
    payload.summary,
    payload.verdictHeading,
    payload.monthRead,
    payload.bookingRead,
    ...(payload.pros ?? []),
    ...(payload.cons ?? []),
    ...(payload.recommendations ?? []),
    ...(payload.tips ?? []),
    ...(payload.bestFor ?? []),
  ]
    .filter(Boolean)
    .join(" ");
  const issues = [];

  if (/verdict of/i.test(payload.summary ?? "")) {
    issues.push("summary should not mention internal verdict wording");
  }

  if (/^.+\bin\b.+\b(scores|is rated)\b/i.test(payload.summary ?? "")) {
    issues.push("summary uses a score-first opening");
  }

  if (
    facts?.contentStrategy?.tier === "selective" &&
    /\b(best time|perfect month|ideal month|najlepszy moment|idealny miesi[aą]c)\b/i.test(
      combinedText,
    )
  ) {
    issues.push("selective-month copy overclaims broad appeal");
  }

  if (
    locale === "pl" &&
    /\b(wypada bardzo dobrze|zdobywa \d+ punkt|notuje \d+ punkt|city break|must see|do ogarni[aą]cia|moc zwiedzania)\b/i.test(
      combinedText,
    )
  ) {
    issues.push("polish copy uses non-editorial or awkward phrasing");
  }

  if (locale === "pl" && /\b(Ten miesiac|slonca|okolo|w dzien)\b/.test(payload.verdictHeading ?? "")) {
    issues.push("polish verdict looks like ASCII fallback text");
  }

  if (
    locale !== defaultLocale &&
    countPatternMatches(combinedText, ENGLISH_LEAK_PATTERNS_BY_LOCALE[locale]) >= 2
  ) {
    issues.push("translated copy still contains English phrasing");
  }

  if (
    locale !== defaultLocale &&
    countPatternMatches(combinedText, INTERNAL_SCORE_PATTERNS_BY_LOCALE[locale]) >= 1
  ) {
    issues.push("translated copy mentions internal score wording");
  }

  if (/,\s*[.!?]/.test(combinedText)) {
    issues.push("copy contains broken punctuation");
  }

  if (
    locale === "pl" &&
    /\b(czyh\.|Czerwie[nń]\b)\b/i.test(
      [payload.summary, payload.verdictHeading, payload.monthRead, payload.bookingRead]
        .filter(Boolean)
        .join(" "),
    )
  ) {
    issues.push("polish copy contains a typo or truncated word");
  }

  if (
    [payload.summary, payload.verdictHeading, payload.monthRead, payload.bookingRead]
      .filter(Boolean)
      .some((value) => hasSuspiciousTailForLocale(value, locale))
  ) {
    issues.push("copy ends with a suspicious truncated fragment");
  }

  if (
    [payload.summary, payload.verdictHeading, payload.monthRead, payload.bookingRead]
      .filter(Boolean)
      .some((value) => hasGenericBrokenTail(value))
  ) {
    issues.push("copy ends with a broken hyphenated fragment");
  }

  if (
    [payload.summary, payload.verdictHeading, payload.monthRead, payload.bookingRead]
      .filter(Boolean)
      .some((value) => hasSuspiciousFinalToken(value, locale))
  ) {
    issues.push("copy ends with a suspicious final token");
  }

  if (
    [payload.summary, payload.verdictHeading, payload.monthRead, payload.bookingRead]
      .filter(Boolean)
      .some((value) => hasUnbalancedEditorialQuotes(value) || hasSuspiciousDashEnding(value))
  ) {
    issues.push("copy ends with unbalanced quotes or a clipped dash fragment");
  }

  if (locale === "pl" && /\bindoor\b/i.test(combinedText)) {
    issues.push("polish copy contains untranslated english wording");
  }

  return issues;
}

function validateAiCopyPayload(payload, locale = defaultLocale, facts = null) {
  const longFields = [payload.summary, payload.verdictHeading, payload.monthRead, payload.bookingRead];

  if (longFields.some((value) => !looksCompleteSentence(value))) {
    throw new Error("AI copy payload ended with an incomplete sentence.");
  }

  for (const [fieldName, maxLength] of Object.entries(NORMALIZED_FIELD_MAX_LENGTHS)) {
    if ((payload[fieldName] ?? "").length > maxLength) {
      throw new Error(`AI copy field ${fieldName} is too long after normalization.`);
    }
  }

  if (payload.verdictHeading.length > NORMALIZED_FIELD_MAX_LENGTHS.verdictHeading) {
    throw new Error("AI copy verdict heading is too long and risks awkward truncation.");
  }

  const qualityIssues = getCopyQualityIssues(payload, locale, facts).filter(
    (issue) => issue !== "copy contains broken punctuation",
  );

  if (qualityIssues.length) {
    throw new Error(`AI copy quality check failed: ${qualityIssues.join("; ")}.`);
  }
}

function needsLongFieldFallback(value, fieldName, locale) {
  if (typeof value !== "string" || !looksCompleteSentence(value)) {
    return true;
  }

  if (value.length >= NORMALIZED_FIELD_MAX_LENGTHS[fieldName] - 6) {
    return true;
  }

  return (
    hasSuspiciousTailForLocale(value, locale) ||
    hasGenericBrokenTail(value) ||
    hasSuspiciousFinalToken(value, locale) ||
    hasUnbalancedEditorialQuotes(value) ||
    hasSuspiciousDashEnding(value)
  );
}

function applyDeterministicLongFieldFallbacks(payload, facts, locale) {
  const nextPayload = { ...payload };

  if (needsLongFieldFallback(payload.summary, "summary", locale)) {
    nextPayload.summary = buildDataDrivenSummary(facts, locale);
  }

  if (needsLongFieldFallback(payload.monthRead, "monthRead", locale)) {
    nextPayload.monthRead = buildDataDrivenMonthRead(facts, locale);
  }

  if (needsLongFieldFallback(payload.bookingRead, "bookingRead", locale)) {
    nextPayload.bookingRead = buildDataDrivenBookingRead(facts, locale);
  }

  return nextPayload;
}

function getVerdictRepairSchema() {
  return {
    type: "object",
    properties: {
      verdictHeading: {
        type: "string",
        minLength: 80,
        maxLength: 260,
      },
    },
    required: ["verdictHeading"],
    additionalProperties: false,
  };
}

function getLongFieldRepairSchema() {
  return {
    type: "object",
    properties: {
      summary: {
        type: "string",
        minLength: 70,
        maxLength: RAW_FIELD_MAX_LENGTHS.summary,
      },
      verdictHeading: {
        type: "string",
        minLength: 80,
        maxLength: RAW_FIELD_MAX_LENGTHS.verdictHeading,
      },
      monthRead: {
        type: "string",
        minLength: 70,
        maxLength: RAW_FIELD_MAX_LENGTHS.monthRead,
      },
      bookingRead: {
        type: "string",
        minLength: 70,
        maxLength: RAW_FIELD_MAX_LENGTHS.bookingRead,
      },
    },
    required: ["summary", "verdictHeading", "monthRead", "bookingRead"],
    additionalProperties: false,
  };
}

async function repairLongFieldsWithClient(client, draftPayload, facts, locale, sourceCopy, model) {
  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await client.responses.create({
        model,
        store: false,
        prompt_cache_key: `travel-copy:field-repair:${locale}:${AI_COPY_PROMPT_VERSION}`,
        prompt_cache_retention: getPromptCacheRetention(model),
        reasoning: {
          effort: "low",
        },
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "Rewrite structured travel copy fields so they read like finished editorial sentences.",
                  "Return valid JSON matching the schema.",
                  "Each field must be exactly 2 complete sentences.",
                  "Keep summary and verdictHeading under 220 characters, and monthRead plus bookingRead under 225 characters.",
                  "Do not leave clipped endings, unfinished clauses, dangling quotes, or half-written place names.",
                  localeInstructions[locale],
                  localeStyleNotes[locale] ?? "",
                ]
                  .join(" ")
                  .trim(),
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  "Current draft JSON:",
                  JSON.stringify({
                    summary: draftPayload.summary,
                    verdictHeading: draftPayload.verdictHeading,
                    monthRead: draftPayload.monthRead,
                    bookingRead: draftPayload.bookingRead,
                  }),
                  "",
                  "Source JSON:",
                  JSON.stringify(sourceCopy),
                  "",
                  "Facts JSON:",
                  JSON.stringify(facts),
                ].join("\n"),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "travel_copy_field_repair",
            strict: true,
            schema: getLongFieldRepairSchema(),
          },
        },
        max_output_tokens: 650,
      });
      const parsed = JSON.parse(response.output_text);

      return {
        summary: parsed.summary,
        verdictHeading: parsed.verdictHeading,
        monthRead: parsed.monthRead,
        bookingRead: parsed.bookingRead,
      };
    } catch (error) {
      lastError = error;

      if (attempt === 2 || !isRetryableCopyError(error)) {
        throw error;
      }

      await sleep(attempt * 1000);
    }
  }

  throw lastError ?? new Error("AI long-field repair failed.");
}

async function repairVerdictHeadingWithClient(client, facts, locale, sourceCopy, model) {
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await client.responses.create({
        model,
        store: false,
        prompt_cache_key: `travel-copy:verdict-repair:${locale}:${AI_COPY_PROMPT_VERSION}`,
        prompt_cache_retention: getPromptCacheRetention(model),
        reasoning: {
          effort: "low",
        },
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "Write one compact editorial verdict for a travel page.",
                  "Return valid JSON matching the schema.",
                  "The verdict must be exactly 2 complete sentences and under 240 characters total.",
                  localeInstructions[locale],
                  localeStyleNotes[locale] ?? "",
                ].join(" ").trim(),
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  "Source verdict heading:",
                  sourceCopy.verdictHeading ?? "",
                  "",
                  "Facts JSON:",
                  JSON.stringify(facts),
                ].join("\n"),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "travel_verdict_heading",
            strict: true,
            schema: getVerdictRepairSchema(),
          },
        },
        max_output_tokens: 220,
      });

      const parsed = JSON.parse(response.output_text);

      if (!looksCompleteSentence(parsed.verdictHeading) || parsed.verdictHeading.length > 300) {
        throw new Error("AI verdict repair returned an incomplete heading.");
      }

      return parsed.verdictHeading;
    } catch (error) {
      lastError = error;

      if (attempt === 3 || !isRetryableCopyError(error)) {
        throw error;
      }

      await sleep(attempt * 1000);
    }
  }

  throw lastError ?? new Error("AI verdict repair failed.");
}

function formatNumber(value) {
  return Number(value).toFixed(1).replace(/\.0$/, "");
}

function formatPolishCount(count, singular, paucal, plural) {
  const absCount = Math.abs(Number(count) || 0);
  const mod10 = absCount % 10;
  const mod100 = absCount % 100;

  if (absCount === 1) {
    return `${absCount} ${singular}`;
  }

  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${absCount} ${paucal}`;
  }

  return `${absCount} ${plural}`;
}

function formatCountPhrase(count, singular, plural) {
  const absCount = Math.abs(Number(count) || 0);
  return `${absCount} ${absCount === 1 ? singular : plural}`;
}

function buildDataDrivenSummary(facts, locale) {
  const city = facts.city ?? "this city";
  const avgTempDay = formatNumber(facts.climate?.avgTempDay ?? 0);
  const strategy = facts.contentStrategy ?? {};

  if (locale === "pl") {
    if (strategy.tier === "selective") {
      return `${city} w tym okresie częściej wygrywa ceną lub spokojem niż pogodą. To dobry wybór dla osób, które planują elastycznie i chętnie korzystają z muzeów.`;
    }

    return `${city} w tym okresie daje około ${avgTempDay}C w dzień i wygodny miks spacerów z muzeami. To dobry moment na miejski wyjazd bez większych komplikacji.`;
  }

  if (locale === "de") {
    if (strategy.tier === "selective") {
      return `${city} punktet in dieser Zeit eher mit Preis und Ruhe als mit perfektem Wetter. Gut passt das zu Reisenden, die flexibel planen und gern Museen nutzen.`;
    }

    return `${city} bietet in dieser Zeit rund ${avgTempDay}C am Tag und eine gute Mischung aus Wegen draußen und Museen. Das macht den Monat zu einer soliden Wahl für eine Städtereise.`;
  }

  if (locale === "es") {
    if (strategy.tier === "selective") {
      return `${city} en este periodo convence más por el valor y la calma que por el tiempo. Funciona mejor si planeas con flexibilidad y te apoyas en museos y planes interiores.`;
    }

    return `${city} en este periodo ofrece unos ${avgTempDay}C de día y un buen equilibrio entre paseos y museos. Es una base sólida para una escapada urbana cómoda.`;
  }

  if (locale === "fr") {
    if (strategy.tier === "selective") {
      return `${city} convainc ici davantage par le budget et le calme que par la météo. Le séjour marche surtout si vous restez souple et si les musées comptent vraiment pour vous.`;
    }

    return `${city} offre ici environ ${avgTempDay}C en journée et un bon équilibre entre balades et musées. Cela en fait une base fiable pour une escapade urbaine.`;
  }

  if (strategy.tier === "selective") {
    return `${city} works better here on value and flexibility than on perfect weather. It suits travelers who are happy to lean on museums and keep plans adaptable.`;
  }

  return `${city} offers around ${avgTempDay}C by day and a good balance of outdoor time plus museums. That makes it a solid setup for an easy city break.`;
}

function buildDataDrivenMonthRead(facts, locale) {
  const city = facts.city ?? "this city";
  const rainyDays = formatNumber(facts.climate?.rainyDays ?? 0);
  const sunshineHours = formatNumber(facts.climate?.sunshineHours ?? 0);
  const strategy = facts.contentStrategy ?? {};

  if (locale === "pl") {
    if (strategy.tier === "selective") {
      return `Ten okres lepiej działa przy elastycznym planie niż przy sztywnym zwiedzaniu od rana do wieczora. Około ${rainyDays} dni z opadem i ${sunshineHours} godz. słońca sprzyja łączeniu muzeów z krótszymi spacerami.`;
    }

    return `${city} w tym czasie daje wygodny rytm zwiedzania i sensowny przekrój atrakcji. Około ${rainyDays} dni z opadem i ${sunshineHours} godz. słońca nadal pozwala dobrze przeplatać spacery z muzeami.`;
  }

  if (locale === "de") {
    if (strategy.tier === "selective") {
      return `Diese Zeit in ${city} funktioniert besser mit flexiblem Plan als mit starren Ganztagesrouten. Rund ${rainyDays} Regentage und ${sunshineHours} Sonnenstunden sprechen für Museen plus kürzere Wege draußen.`;
    }

    return `${city} bietet in dieser Zeit einen gut nutzbaren Rhythmus fürs Sightseeing und genug Abwechslung. Rund ${rainyDays} Regentage und ${sunshineHours} Sonnenstunden lassen draußen plus Museen weiterhin gut kombinieren.`;
  }

  if (locale === "es") {
    if (strategy.tier === "selective") {
      return `Este periodo en ${city} funciona mejor con un plan flexible que con días cerrados de principio a fin. Unos ${rainyDays} días de lluvia y ${sunshineHours} horas de sol favorecen combinar museos con paseos cortos.`;
    }

    return `${city} mantiene en este periodo un ritmo cómodo para visitar la ciudad y alternar planes. Unos ${rainyDays} días de lluvia y ${sunshineHours} horas de sol siguen permitiendo mezclar museos con caminatas.`;
  }

  if (locale === "fr") {
    if (strategy.tier === "selective") {
      return `Cette période à ${city} marche mieux avec un programme souple qu’avec des journées figées du matin au soir. Environ ${rainyDays} jours de pluie et ${sunshineHours} heures de soleil poussent vers un mix musées plus balades courtes.`;
    }

    return `${city} garde sur cette période un rythme agréable pour visiter la ville sans se compliquer. Environ ${rainyDays} jours de pluie et ${sunshineHours} heures de soleil permettent encore d’alterner musées et sorties.`;
  }

  if (strategy.tier === "selective") {
    return `This period in ${city} works better with a flexible plan than with fixed all-day sightseeing. Around ${rainyDays} rainy days and ${sunshineHours} hours of sun push the trip toward museums plus shorter outdoor stretches.`;
  }

  return `${city} keeps a comfortable sightseeing rhythm in this period and still offers a useful mix of plans. Around ${rainyDays} rainy days and ${sunshineHours} hours of sun still let you alternate museums with time outside.`;
}

function buildDataDrivenBookingRead(facts, locale) {
  const city = facts.city ?? "this city";
  const strategy = facts.contentStrategy ?? {};

  if (locale === "pl") {
    if (strategy.tier === "selective") {
      return `Rozważ ten termin, jeśli szukasz spokojniejszego lub tańszego wyjazdu i możesz układać plan pod wnętrza. Jeśli kluczowa jest pogoda i pełniejsze zwiedzanie, porównaj ten okres z lepiej ocenianymi miesiącami.`;
    }

    return `Rezerwuj ${city} z normalnym wyprzedzeniem, bez panicznego pośpiechu. To dość przewidywalny moment, więc wcześniejszy nocleg pomaga, ale nie wymusza walki o każdy termin.`;
  }

  if (locale === "de") {
    if (strategy.tier === "selective") {
      return `Buchen Sie ${city}, wenn Sie eher Ruhe oder einen günstigeren Trip suchen und den Plan auf Innenräume stützen können. Wenn Wetter und volles Outdoor-Sightseeing wichtiger sind, vergleichen Sie lieber stärkere Monate.`;
    }

    return `Buchen Sie ${city} mit normalem Vorlauf, aber ohne Hektik. Die Zeit ist insgesamt recht planbar, daher hilft frühes Buchen, ohne dass sofort jeder Termin verschwindet.`;
  }

  if (locale === "es") {
    if (strategy.tier === "selective") {
      return `Reserva ${city} si buscas un viaje más tranquilo o más barato y puedes apoyar el plan en interiores. Si para ti manda el tiempo y el paseo continuo por fuera, compáralo mejor con meses más fuertes.`;
    }

    return `Reserva ${city} con antelación normal, sin necesidad de agobiarte. Es un momento bastante previsible, así que adelantarte ayuda, pero no obliga a pelear por cada fecha.`;
  }

  if (locale === "fr") {
    if (strategy.tier === "selective") {
      return `Réservez ${city} si vous cherchez un séjour plus calme ou moins cher et si les intérieurs vous conviennent bien. Si la météo et les longues journées dehors comptent davantage, comparez plutôt avec des mois plus forts.`;
    }

    return `Réservez ${city} avec une avance normale, sans urgence excessive. La période reste assez prévisible, donc anticiper aide, sans pour autant transformer chaque date en course.`;
  }

  if (strategy.tier === "selective") {
    return `Book ${city} if you want a calmer or cheaper trip and can lean on indoor plans. If weather and full outdoor sightseeing matter more, compare this period with stronger months.`;
  }

  return `Book ${city} with normal advance planning rather than urgency. This is a fairly predictable period, so earlier booking helps without turning every date into a rush.`;
}

function buildDataDrivenVerdictHeading(facts, locale) {
  const city = facts.city ?? "this city";
  const indoorAttractions = facts.attractionSummary?.indoorShown ?? 0;
  const outdoorAttractions = facts.attractionSummary?.outdoorShown ?? 0;
  const rainyDays = formatNumber(facts.climate?.rainyDays ?? 0);
  const sunshineHours = formatNumber(facts.climate?.sunshineHours ?? 0);
  const avgTempDay = formatNumber(facts.climate?.avgTempDay ?? 0);
  const strategy = facts.contentStrategy ?? {};

  if (locale === "pl") {
    const indoorPhrase = formatPolishCount(
      indoorAttractions,
      "mocna atrakcja pod dachem",
      "mocne atrakcje pod dachem",
      "mocnych atrakcji pod dachem",
    );
    const outdoorPhrase = formatPolishCount(
      outdoorAttractions,
      "mocny punkt na zewnątrz",
      "mocne punkty na zewnątrz",
      "mocnych punktów na zewnątrz",
    );

    if (strategy.tier === "selective" && strategy.primaryAngle === "budget") {
      return `${city} w tym miesiącu bardziej broni się ceną niż idealnymi warunkami. Przy ${rainyDays} dniach z opadem i temperaturze blisko ${avgTempDay}C najlepiej traktować go jako tańszy, elastyczny wyjazd miejski.`;
    }

    if (strategy.tier === "selective" && strategy.primaryAngle === "quiet") {
      return `${city} w tym miesiącu częściej wygrywa spokojniejszym rytmem niż idealną pogodą. Przy około ${avgTempDay}C w dzień i ${rainyDays} dniach z opadem najlepiej stawiać na luźniejszy plan i mniej kolejek.`;
    }

    if (strategy.tier === "selective" && strategy.primaryAngle === "indoor") {
      return `${city} w tym miesiącu lepiej działa jako plan z przewagą miejsc pod dachem niż jako całodzienny spacer. ${indoorPhrase} oraz ${rainyDays} dni z opadem sprawiają, że elastyczny układ dnia daje tu najwięcej.`;
    }

    return `${city} w tym miesiącu nadal układa się w sensowny plan, bo ${outdoorPhrase} dobrze łączą się z ${indoorPhrase}. Przy ${rainyDays} dniach z opadem, około ${sunshineHours} godz. słońca i temperaturze blisko ${avgTempDay}C najlepiej łączyć spacery z muzeami i pałacami.`;
  }

  if (locale === "de") {
    const indoorPhrase = formatCountPhrase(indoorAttractions, "starker Indoor-Stopp", "starke Indoor-Stopps");
    const outdoorPhrase = formatCountPhrase(
      outdoorAttractions,
      "starkes Ziel draußen",
      "starke Ziele draußen",
    );

    if (strategy.tier === "selective" && strategy.primaryAngle === "budget") {
      return `${city} verkauft sich in diesem Monat eher über den Preis als über perfekte Bedingungen. Bei ${rainyDays} Regentagen und rund ${avgTempDay}C am Tag passt er am besten zu einer günstigeren, flexibleren Städtereise.`;
    }

    if (strategy.tier === "selective" && strategy.primaryAngle === "quiet") {
      return `${city} lebt in diesem Monat mehr von ruhigerem Sightseeing als von idealem Wetter. Mit rund ${avgTempDay}C am Tag und ${rainyDays} Regentagen passt er besser zu lockerem Tempo und etwas mehr Raum im Plan.`;
    }

    if (strategy.tier === "selective" && strategy.primaryAngle === "indoor") {
      return `${city} funktioniert in diesem Monat besser für Museumszeit als für lange Tage draußen. ${indoorPhrase} und ${rainyDays} Regentage sprechen für einen flexiblen Plan mit Schwerpunkt drinnen.`;
    }

    return `${city} kann in diesem Monat trotzdem funktionieren, weil ${outdoorPhrase} gut mit ${indoorPhrase} zusammengehen. Bei ${rainyDays} Regentagen, ${sunshineHours} Sonnenstunden und rund ${avgTempDay}C tagsüber ist ein Wechsel zwischen Wegen draußen und Museen die sicherste Variante.`;
  }

  if (locale === "es") {
    const indoorPhrase = formatCountPhrase(
      indoorAttractions,
      "parada potente en interior",
      "paradas potentes en interior",
    );
    const outdoorPhrase = formatCountPhrase(
      outdoorAttractions,
      "punto fuerte al aire libre",
      "puntos fuertes al aire libre",
    );

    if (strategy.tier === "selective" && strategy.primaryAngle === "budget") {
      return `${city} en este mes convence más por el coste que por unas condiciones perfectas. Con ${rainyDays} días de lluvia y unos ${avgTempDay}C durante el día, funciona mejor como una escapada urbana más barata y flexible.`;
    }

    if (strategy.tier === "selective" && strategy.primaryAngle === "quiet") {
      return `${city} en este mes gana más por el ritmo tranquilo que por un tiempo ideal. Con unos ${avgTempDay}C durante el día y ${rainyDays} días de lluvia, encaja mejor con planes flexibles y menos presión.`;
    }

    if (strategy.tier === "selective" && strategy.primaryAngle === "indoor") {
      return `${city} en este mes funciona mejor para días centrados en museos que para caminar todo el día. ${indoorPhrase} y ${rainyDays} días de lluvia favorecen un plan flexible con más tiempo bajo techo.`;
    }

    return `${city} todavía puede funcionar este mes porque ${outdoorPhrase} se combinan bien con ${indoorPhrase}. Con ${rainyDays} días de lluvia, ${sunshineHours} horas de sol y unos ${avgTempDay}C durante el día, lo más seguro es alternar paseos cortos con museos y palacios.`;
  }

  if (locale === "fr") {
    const indoorPhrase = formatCountPhrase(
      indoorAttractions,
      "visite forte en intérieur",
      "visites fortes en intérieur",
    );
    const outdoorPhrase = formatCountPhrase(
      outdoorAttractions,
      "point fort en extérieur",
      "points forts en extérieur",
    );

    if (strategy.tier === "selective" && strategy.primaryAngle === "budget") {
      return `${city} se défend surtout par le prix ce mois-ci plutôt que par des conditions parfaites. Avec ${rainyDays} jours de pluie et environ ${avgTempDay}C en journée, cela marche mieux pour une escapade urbaine plus souple et moins chère.`;
    }

    if (strategy.tier === "selective" && strategy.primaryAngle === "quiet") {
      return `${city} ce mois-ci convainc davantage par un rythme plus calme que par une météo idéale. Avec environ ${avgTempDay}C en journée et ${rainyDays} jours de pluie, cela convient mieux à un programme léger et adaptable.`;
    }

    if (strategy.tier === "selective" && strategy.primaryAngle === "indoor") {
      return `${city} fonctionne mieux ce mois-ci pour des journées centrées sur les musées que pour de longues marches dehors. ${indoorPhrase} et ${rainyDays} jours de pluie favorisent un programme souple axé sur les lieux couverts.`;
    }

    return `${city} peut quand même fonctionner ce mois-ci car ${outdoorPhrase} se combinent bien avec ${indoorPhrase}. Avec ${rainyDays} jours de pluie, ${sunshineHours} heures de soleil et environ ${avgTempDay}C en journée, le mieux est d'alterner sorties courtes et musées.`;
  }

  if (strategy.tier === "selective" && strategy.primaryAngle === "budget") {
    return `${city} this month sells more on value than on perfect conditions. With ${rainyDays} rainy days and about ${avgTempDay}C by day, it works best as a cheaper, more flexible city break.`;
  }

  if (strategy.tier === "selective" && strategy.primaryAngle === "quiet") {
    return `${city} this month is more about calmer sightseeing than postcard weather. With about ${avgTempDay}C by day and ${rainyDays} rainy days, it suits travelers who value space and a looser pace.`;
  }

  if (strategy.tier === "selective" && strategy.primaryAngle === "indoor") {
    return `${city} this month works better for museum-led days than all-day wandering. ${indoorAttractions} strong indoor stops plus ${rainyDays} rainy days make flexible indoor-first planning the safer bet.`;
  }

  return `${city} still works this month because ${outdoorAttractions} outdoor highlights pair well with ${indoorAttractions} strong indoor stops. With ${rainyDays} rainy days, ${sunshineHours} hours of sun, and about ${avgTempDay}C by day, it is best to mix shorter outdoor stretches with museums and palaces.`;
}

function buildCopyResult(page, parsed, model, locale) {
  return {
    summary: parsed.summary,
    verdict: {
      ...page.verdict,
      heading: parsed.verdictHeading,
      pros: parsed.pros,
      cons: parsed.cons,
    },
    recommendations: parsed.recommendations,
    tips: parsed.tips,
    editorial: {
      bestFor: parsed.bestFor,
      monthRead: parsed.monthRead,
      bookingRead: parsed.bookingRead,
    },
    copyMeta: {
      source: "openai",
      model,
      promptVersion: AI_COPY_PROMPT_VERSION,
      locale,
      generatedAt: new Date().toISOString(),
    },
  };
}

function getUsageMetrics(usage) {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    cachedInputTokens: usage?.input_tokens_details?.cached_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
  };
}

function estimateCostUsd(model, usage) {
  const pricing = MODEL_PRICING_BY_MILLION[model];

  if (!pricing) {
    return 0;
  }

  const uncachedInputTokens = Math.max(0, usage.inputTokens - usage.cachedInputTokens);

  return (
    (uncachedInputTokens * pricing.input) / 1_000_000 +
    (usage.cachedInputTokens * pricing.cachedInput) / 1_000_000 +
    (usage.outputTokens * pricing.output) / 1_000_000
  );
}

export function createEmptyRunStats() {
  return {
    pagesProcessed: 0,
    requests: 0,
    retries: 0,
    fallbackVerdicts: 0,
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
    latenciesMs: [],
    perModel: {},
    batches: [],
  };
}

function getOrCreateModelStats(stats, model) {
  if (!stats.perModel[model]) {
    stats.perModel[model] = {
      requests: 0,
      retries: 0,
      fallbackVerdicts: 0,
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      latenciesMs: [],
    };
  }

  return stats.perModel[model];
}

function recordRequestStats(stats, requestStats) {
  stats.requests += 1;
  stats.retries += requestStats.retryCount;
  stats.fallbackVerdicts += requestStats.fallbackVerdictCount;
  stats.inputTokens += requestStats.usage.inputTokens;
  stats.cachedInputTokens += requestStats.usage.cachedInputTokens;
  stats.outputTokens += requestStats.usage.outputTokens;
  stats.estimatedCostUsd += requestStats.estimatedCostUsd;
  stats.latenciesMs.push(requestStats.latencyMs);

  const modelStats = getOrCreateModelStats(stats, requestStats.model);
  modelStats.requests += 1;
  modelStats.retries += requestStats.retryCount;
  modelStats.fallbackVerdicts += requestStats.fallbackVerdictCount;
  modelStats.inputTokens += requestStats.usage.inputTokens;
  modelStats.cachedInputTokens += requestStats.usage.cachedInputTokens;
  modelStats.outputTokens += requestStats.usage.outputTokens;
  modelStats.estimatedCostUsd += requestStats.estimatedCostUsd;
  modelStats.latenciesMs.push(requestStats.latencyMs);
}

function getAverage(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getP95(values) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index];
}

function roundNumber(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function finalizeModelStats(modelStats) {
  return {
    requests: modelStats.requests,
    retries: modelStats.retries,
    fallbackVerdicts: modelStats.fallbackVerdicts,
    inputTokens: modelStats.inputTokens,
    cachedInputTokens: modelStats.cachedInputTokens,
    outputTokens: modelStats.outputTokens,
    estimatedCostUsd: roundNumber(modelStats.estimatedCostUsd, 4),
    averageLatencyMs: roundNumber(getAverage(modelStats.latenciesMs), 1),
    p95LatencyMs: roundNumber(getP95(modelStats.latenciesMs), 1),
    cacheHitRatio:
      modelStats.inputTokens > 0
        ? roundNumber(modelStats.cachedInputTokens / modelStats.inputTokens, 4)
        : 0,
  };
}

export function finalizeRunStats(stats) {
  return {
    pagesProcessed: stats.pagesProcessed,
    requests: stats.requests,
    retries: stats.retries,
    fallbackVerdicts: stats.fallbackVerdicts,
    inputTokens: stats.inputTokens,
    cachedInputTokens: stats.cachedInputTokens,
    outputTokens: stats.outputTokens,
    estimatedCostUsd: roundNumber(stats.estimatedCostUsd, 4),
    averageLatencyMs: roundNumber(getAverage(stats.latenciesMs), 1),
    p95LatencyMs: roundNumber(getP95(stats.latenciesMs), 1),
    cacheHitRatio:
      stats.inputTokens > 0 ? roundNumber(stats.cachedInputTokens / stats.inputTokens, 4) : 0,
    perModel: Object.fromEntries(
      Object.entries(stats.perModel).map(([model, modelStats]) => [
        model,
        finalizeModelStats(modelStats),
      ]),
    ),
    batches: stats.batches.map((batch) => ({
      ...batch,
      averageLatencyMs: roundNumber(batch.averageLatencyMs, 1),
      p95LatencyMs: roundNumber(batch.p95LatencyMs, 1),
      cacheHitRatio: roundNumber(batch.cacheHitRatio, 4),
      estimatedCostUsd: roundNumber(batch.estimatedCostUsd, 4),
    })),
  };
}

function mergePerModelStats(targetStats, sourceStats) {
  for (const [model, modelStats] of Object.entries(sourceStats.perModel ?? {})) {
    const targetModel = getOrCreateModelStats(targetStats, model);
    targetModel.requests += modelStats.requests ?? 0;
    targetModel.retries += modelStats.retries ?? 0;
    targetModel.fallbackVerdicts += modelStats.fallbackVerdicts ?? 0;
    targetModel.inputTokens += modelStats.inputTokens ?? 0;
    targetModel.cachedInputTokens += modelStats.cachedInputTokens ?? 0;
    targetModel.outputTokens += modelStats.outputTokens ?? 0;
    targetModel.estimatedCostUsd += modelStats.estimatedCostUsd ?? 0;
    targetModel.latenciesMs.push(...(modelStats.latenciesMs ?? []));
  }
}

export function mergeAiCopyRunStats(target, source) {
  target.pagesProcessed += source.pagesProcessed ?? 0;
  target.requests += source.requests ?? 0;
  target.retries += source.retries ?? 0;
  target.fallbackVerdicts += source.fallbackVerdicts ?? 0;
  target.inputTokens += source.inputTokens ?? 0;
  target.cachedInputTokens += source.cachedInputTokens ?? 0;
  target.outputTokens += source.outputTokens ?? 0;
  target.estimatedCostUsd += source.estimatedCostUsd ?? 0;
  target.latenciesMs.push(...(source.latenciesMs ?? []));
  mergePerModelStats(target, source);
  target.batches.push(...(source.batches ?? []));
  return target;
}

function createRequestTelemetry({
  model,
  latencyMs,
  usage,
  retryCount,
  fallbackVerdictCount,
  shouldReduceConcurrency,
}) {
  const normalizedUsage = getUsageMetrics(usage);

  return {
    model,
    latencyMs,
    usage: normalizedUsage,
    retryCount,
    fallbackVerdictCount,
    shouldReduceConcurrency,
    estimatedCostUsd: estimateCostUsd(model, normalizedUsage),
  };
}

function formatUsd(value) {
  return `$${value.toFixed(4)}`;
}

export function printAiCopyRunSummary(summary, label = "AI copy run") {
  console.log(`${label} summary:`);
  console.log(
    `- pages=${summary.pagesProcessed}, requests=${summary.requests}, retries=${summary.retries}, fallbackVerdicts=${summary.fallbackVerdicts}`,
  );
  console.log(
    `- latency avg=${summary.averageLatencyMs}ms p95=${summary.p95LatencyMs}ms, cacheHit=${roundNumber(summary.cacheHitRatio * 100, 1)}%`,
  );
  console.log(
    `- tokens input=${summary.inputTokens}, cached=${summary.cachedInputTokens}, output=${summary.outputTokens}, estimatedCost=${formatUsd(summary.estimatedCostUsd)}`,
  );

  for (const [model, modelStats] of Object.entries(summary.perModel)) {
    console.log(
      `- model=${model}: requests=${modelStats.requests}, cacheHit=${roundNumber(modelStats.cacheHitRatio * 100, 1)}%, avgLatency=${modelStats.averageLatencyMs}ms, cost=${formatUsd(modelStats.estimatedCostUsd)}`,
    );
  }
}

function getConcurrencySettings(locale, options = {}) {
  const mode = getGenerationMode(locale);
  const defaultStart =
    mode === "source" ? DEFAULT_SOURCE_CONCURRENCY : DEFAULT_TRANSLATION_CONCURRENCY;
  const defaultMax =
    mode === "source" ? DEFAULT_SOURCE_MAX_CONCURRENCY : DEFAULT_TRANSLATION_MAX_CONCURRENCY;
  const start = Math.max(1, Number(options.initialConcurrency ?? defaultStart));
  const min = Math.max(1, Number(options.minConcurrency ?? 1));
  const max = Math.max(start, Number(options.maxConcurrency ?? defaultMax));

  return { start, min, max };
}

function getRequestParams(page, locale, options = {}) {
  const mode = getGenerationMode(locale);
  const model = options.modelOverride ?? getModelForLocale(locale);
  const facts = makePromptFacts(page);
  const sourceCopy = makeSourceCopy(page, options.sourceCopy);
  const inputText =
    mode === "translation"
      ? buildTranslationUserPrompt(sourceCopy, facts, locale)
      : buildSourceUserPrompt(facts);

  return {
    model,
    mode,
    facts,
    sourceCopy,
    responseParams: {
      model,
      store: false,
      prompt_cache_key: getPromptCacheKey(locale),
      prompt_cache_retention: getPromptCacheRetention(model),
      reasoning: {
        effort: "low",
      },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: buildSystemPrompt(locale, mode),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: inputText,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "travel_copy_payload",
          strict: true,
          schema: getCopySchema(),
        },
      },
      max_output_tokens: mode === "translation" ? 1200 : 900,
    },
  };
}

export async function generateAiCopyForPage(page, locale = defaultLocale, options = {}) {
  const result = await generateAiCopyForPageWithClient(createClient(), page, locale, options);
  return result.copy;
}

export async function generateAiCopyForPageWithClient(client, page, locale = defaultLocale, options = {}) {
  const { model, facts, sourceCopy, responseParams } = getRequestParams(page, locale, options);
  const enableVerdictRepair = getBooleanEnv("COPY_ENABLE_VERDICT_REPAIR", false);

  let lastError = null;
  let sawConcurrencyReductionError = false;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const startedAt = Date.now();
    let response = null;
    let parsed = null;
    let fallbackVerdictCount = 0;

    try {
      response = await client.responses.create(responseParams);
      parsed = normalizeAiCopyPayload(JSON.parse(response.output_text), locale);

      try {
        validateAiCopyPayload(parsed, locale, facts);
      } catch (validationError) {
        const shouldRepairLongFields =
          parsed &&
          /incomplete sentence|quality check failed|field .+ is too long after normalization/i.test(
            validationError.message ?? "",
          );

        if (shouldRepairLongFields) {
          try {
            const repairedFields = await repairLongFieldsWithClient(
              client,
              parsed,
              facts,
              locale,
              sourceCopy,
              locale === defaultLocale ? model : DEFAULT_SOURCE_MODEL,
            );
            parsed = normalizeAiCopyPayload(
              {
                ...parsed,
                ...repairedFields,
              },
              locale,
            );
            validateAiCopyPayload(parsed, locale, facts);
          } catch {}
        }

        if (parsed) {
          parsed = normalizeAiCopyPayload(
            applyDeterministicLongFieldFallbacks(parsed, facts, locale),
            locale,
          );
        }

        if (
          parsed?.verdictHeading &&
          typeof parsed.verdictHeading === "string" &&
          (
            parsed.verdictHeading.length >= NORMALIZED_FIELD_MAX_LENGTHS.verdictHeading ||
            !looksCompleteSentence(parsed.verdictHeading)
          )
        ) {
          if (enableVerdictRepair) {
            try {
              parsed.verdictHeading = normalizeVerdictHeading(
                await repairVerdictHeadingWithClient(client, facts, locale, sourceCopy, model),
                locale,
              );
              fallbackVerdictCount += 1;
            } catch {
              parsed.verdictHeading = normalizeVerdictHeading(
                buildDataDrivenVerdictHeading(facts, locale),
                locale,
              );
              fallbackVerdictCount += 1;
            }
          } else {
            parsed.verdictHeading = normalizeVerdictHeading(
              buildDataDrivenVerdictHeading(facts, locale),
              locale,
            );
            fallbackVerdictCount += 1;
          }

          validateAiCopyPayload(parsed, locale, facts);
        } else if (parsed) {
          validateAiCopyPayload(parsed, locale, facts);
        } else {
          throw validationError;
        }
      }

      return {
        copy: buildCopyResult(page, parsed, model, locale),
        telemetry: createRequestTelemetry({
          model,
          latencyMs: Date.now() - startedAt,
          usage: response.usage,
          retryCount: attempt - 1,
          fallbackVerdictCount,
          shouldReduceConcurrency: sawConcurrencyReductionError,
        }),
      };
    } catch (error) {
      lastError = error;
      const latencyMs = Date.now() - startedAt;
      const shouldReduceConcurrency = isConcurrencyReductionError(error);
      const canEscalateQuality =
        locale !== defaultLocale &&
        options.allowQualityEscalation !== false &&
        model !== DEFAULT_SOURCE_MODEL &&
        isRetryableCopyError(error);
      sawConcurrencyReductionError ||= shouldReduceConcurrency;

      if (!isRetryableCopyError(error) || (attempt === 3 && !canEscalateQuality)) {
        error.aiCopyPage = {
          slug: page.slug,
          cityId: page.cityId,
          month: page.month,
          locale,
        };
        if (parsed) {
          error.aiCopyPayloadPreview = {
            summary: parsed.summary,
            verdictHeading: parsed.verdictHeading,
            monthRead: parsed.monthRead,
            bookingRead: parsed.bookingRead,
          };
        }
        error.aiCopyTelemetry = createRequestTelemetry({
          model,
          latencyMs,
          usage: response?.usage,
          retryCount: attempt - 1,
          fallbackVerdictCount,
          shouldReduceConcurrency,
        });
        throw error;
      }

      if (attempt === 3) {
        break;
      }

      await sleep(attempt * 1000);
    }
  }

  if (
    locale !== defaultLocale &&
    options.allowQualityEscalation !== false &&
    model !== DEFAULT_SOURCE_MODEL &&
    isRetryableCopyError(lastError)
  ) {
    return generateAiCopyForPageWithClient(client, page, locale, {
      ...options,
      modelOverride: DEFAULT_SOURCE_MODEL,
      allowQualityEscalation: false,
    });
  }

  throw lastError ?? new Error("Failed to generate AI copy.");
}

export async function enrichPagesWithAiCopy(pages, locale = defaultLocale, options = {}) {
  const client = options.client ?? createClient();
  const sourceCopyMap = options.sourceCopyMap ?? {};
  const stats = createEmptyRunStats();
  const concurrencySettings = getConcurrencySettings(locale, {
    initialConcurrency: options.initialConcurrency ?? options.concurrency,
    minConcurrency: options.minConcurrency,
    maxConcurrency: options.maxConcurrency,
  });

  let effectiveConcurrency = concurrencySettings.start;
  let goodBatchStreak = 0;
  const updatedPages = [];

  for (let index = 0; index < pages.length; ) {
    const batch = pages.slice(index, index + effectiveConcurrency);
    const batchStartedAt = Date.now();
    const batchResults = await Promise.all(
      batch.map(async (page) => {
        const sourceCopy =
          locale === defaultLocale
            ? undefined
            : sourceCopyMap[buildPageCopyKey(page.cityId, page.month)] ?? null;

        if (locale !== defaultLocale && !sourceCopy) {
          throw new Error(
            `Missing source copy for ${page.cityId} ${page.month} (${locale}). Generate ${defaultLocale} copy first.`,
          );
        }

        const result = await generateAiCopyForPageWithClient(client, page, locale, {
          sourceCopy,
        });

        return {
          ...page,
          ...result.copy,
          __aiTelemetry: result.telemetry,
        };
      }),
    );

    const batchLatencies = batchResults.map((page) => page.__aiTelemetry.latencyMs);
    const batchAverageLatencyMs = getAverage(batchLatencies);
    const batchP95LatencyMs = getP95(batchLatencies);
    const batchRetries = batchResults.reduce(
      (sum, page) => sum + page.__aiTelemetry.retryCount,
      0,
    );
    const batchFallbackVerdicts = batchResults.reduce(
      (sum, page) => sum + page.__aiTelemetry.fallbackVerdictCount,
      0,
    );
    const batchInputTokens = batchResults.reduce(
      (sum, page) => sum + page.__aiTelemetry.usage.inputTokens,
      0,
    );
    const batchCachedInputTokens = batchResults.reduce(
      (sum, page) => sum + page.__aiTelemetry.usage.cachedInputTokens,
      0,
    );
    const batchOutputTokens = batchResults.reduce(
      (sum, page) => sum + page.__aiTelemetry.usage.outputTokens,
      0,
    );
    const batchEstimatedCostUsd = batchResults.reduce(
      (sum, page) => sum + page.__aiTelemetry.estimatedCostUsd,
      0,
    );
    const batchCacheHitRatio =
      batchInputTokens > 0 ? batchCachedInputTokens / batchInputTokens : 0;
    const model = batchResults[0]?.copyMeta?.model ?? getModelForLocale(locale);

    for (const page of batchResults) {
      recordRequestStats(stats, page.__aiTelemetry);
      updatedPages.push(Object.fromEntries(Object.entries(page).filter(([key]) => key !== "__aiTelemetry")));
    }

    stats.pagesProcessed += batchResults.length;
    stats.batches.push({
      model,
      pagesProcessed: batchResults.length,
      concurrency: effectiveConcurrency,
      averageLatencyMs: batchAverageLatencyMs,
      p95LatencyMs: batchP95LatencyMs,
      cacheHitRatio: batchCacheHitRatio,
      retries: batchRetries,
      fallbackVerdicts: batchFallbackVerdicts,
      estimatedCostUsd: batchEstimatedCostUsd,
      inputTokens: batchInputTokens,
      cachedInputTokens: batchCachedInputTokens,
      outputTokens: batchOutputTokens,
      durationMs: Date.now() - batchStartedAt,
    });

    console.log(
      `AI copy batch locale=${locale} processed=${stats.pagesProcessed}/${pages.length} concurrency=${effectiveConcurrency} model=${model} avgLatency=${roundNumber(batchAverageLatencyMs, 1)}ms cacheHit=${roundNumber(batchCacheHitRatio * 100, 1)}%`,
    );

    const shouldReduceConcurrency =
      batchP95LatencyMs > BATCH_P95_SLOW_MS || batchResults.some((page) => page.__aiTelemetry.shouldReduceConcurrency);

    if (shouldReduceConcurrency) {
      effectiveConcurrency = Math.max(concurrencySettings.min, effectiveConcurrency - 1);
      goodBatchStreak = 0;
    } else if (batchRetries === 0 && batchP95LatencyMs < BATCH_P95_FAST_MS) {
      goodBatchStreak += 1;

      if (
        goodBatchStreak >= GOOD_BATCH_STREAK_FOR_SCALE_UP &&
        effectiveConcurrency < concurrencySettings.max
      ) {
        effectiveConcurrency += 1;
        goodBatchStreak = 0;
      }
    } else {
      goodBatchStreak = 0;
    }

    index += batch.length;
  }

  return {
    pages: updatedPages,
    stats,
    summary: finalizeRunStats(stats),
  };
}
