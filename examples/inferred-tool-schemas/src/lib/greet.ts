export interface GreetingInput {
  /** The name of the person to greet. */
  name: string;
  /** Language of the greeting. Defaults to English in the handler. */
  language?: "en" | "es";
}

/** Greet a person in English or Spanish. */
export function greet({ name, language = "en" }: GreetingInput) {
  return `${language === "es" ? "Hola" : "Hello"}, ${name}!`;
}
