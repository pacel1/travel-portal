import OpenAI from "openai";

const localeInstructions = {
  en: "Return natural English visitor-facing names.",
  de: "Return natural German visitor-facing names.",
  es: "Return natural Spanish visitor-facing names.",
  fr: "Return natural French visitor-facing names.",
  pl: "Return natural Polish visitor-facing names.",
};

function createClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env.local before generating POI localizations.");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getModel() {
  return process.env.OPENAI_POI_MODEL ?? "gpt-5.4-nano";
}

function getSchema() {
  return {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", minLength: 2, maxLength: 140 },
          },
          required: ["id", "name"],
          additionalProperties: false,
        },
      },
    },
    required: ["items"],
    additionalProperties: false,
  };
}

export async function localizePoiBatch(batch, locale) {
  const client = createClient();
  const model = getModel();
  const response = await client.responses.create({
    model,
    store: false,
    reasoning: { effort: "low" },
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `You localize point-of-interest names for static travel pages. ${localeInstructions[locale] ?? localeInstructions.en} Preserve proper nouns. Translate generic place types like palace, cathedral, museum, church, cemetery chapel, castle, park, gate, town hall, and synagogue when that is natural in the target language. If a globally established exonym exists, prefer it. If there is no confident natural localized form, keep the original name. Never invent attractions, districts, or explanatory subtitles. Output only the localized short display name for each item.`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Localize these POI names:\n${JSON.stringify(batch, null, 2)}`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "poi_localization_batch",
        strict: true,
        schema: getSchema(),
      },
    },
    max_output_tokens: 1400,
  });

  const parsed = JSON.parse(response.output_text);
  const localizedMap = new Map(
    (parsed.items ?? []).map((item) => [item.id, item.name.trim()]),
  );

  return batch.map((item) => ({
    poiId: item.id,
    locale,
    name: localizedMap.get(item.id) ?? item.name,
  }));
}

export async function localizePois(pois, locale, options = {}) {
  const batchSize = Math.max(1, options.batchSize ?? 20);
  const rows = [];

  for (let index = 0; index < pois.length; index += batchSize) {
    const batch = pois.slice(index, index + batchSize);
    const localizedBatch = await localizePoiBatch(batch, locale);
    rows.push(...localizedBatch);
  }

  return rows;
}
