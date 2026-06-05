import type { Language } from "./types";

export const languageOptions = [
  { code: "en" as Language, label: "EN" },
  { code: "es" as Language, label: "ES" },
  { code: "pt" as Language, label: "PT" },
] as const;
