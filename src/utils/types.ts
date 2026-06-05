export type AuthMode = "login" | "register";

export type Language = "en" | "es" | "pt";

export const languageOptions = [
  { code: "en" as Language, label: "EN" },
  { code: "es" as Language, label: "ES" },
  { code: "pt" as Language, label: "PT" },
] as const;
