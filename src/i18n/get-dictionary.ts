import type { LocaleCode } from "@/lib/i18n";

import { enDictionary } from "./dictionaries/en";
import { plDictionary } from "./dictionaries/pl";

type DeepWiden<T> =
  T extends string ? string
  : T extends readonly (infer U)[] ? readonly DeepWiden<U>[]
  : T extends object ? { [K in keyof T]: DeepWiden<T[K]> }
  : T;

export type AppDictionary = DeepWiden<typeof enDictionary>;

export function getDictionary(locale: LocaleCode = "en"): AppDictionary {
  switch (locale) {
    case "pl":
      return plDictionary;
    case "en":
    case "de":
    case "es":
    case "fr":
    default:
      return enDictionary;
  }
}
