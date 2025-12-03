/**
 * A header with a static value (use only for non-sensitive values)
 */
export interface StaticHeader {
  name: string;
  value: string;
}

/**
 * A header that reads its value from an environment variable at runtime.
 * Use this for sensitive values like API keys and authorization tokens.
 */
export interface EnvHeader {
  name: string;
  /** The name of the environment variable to read at runtime */
  env: string;
}

export type CustomHeader = StaticHeader | EnvHeader;

export type CustomHeaders = CustomHeader[];

export const createEmptyHeader = (): StaticHeader => ({
  name: "",
  value: "",
});

/**
 * Check if a header uses an environment variable reference
 */
export const isEnvHeader = (header: CustomHeader): header is EnvHeader => {
  return "env" in header && typeof header.env === "string";
};

/**
 * Converts CustomHeaders to a Record, resolving environment variables at runtime.
 * Throws if a required env var is not set.
 */
export const headersToRecord = (
  headers: CustomHeaders
): Record<string, string> => {
  const record: Record<string, string> = {};

  headers.forEach((header) => {
    const name = header.name.trim();

    if (isEnvHeader(header)) {
      const envValue = process.env[header.env];
      if (envValue === undefined) {
        throw new Error(
          `Environment variable "${header.env}" is not set (required for header "${name}")`
        );
      }
      record[name] = envValue;
    } else {
      record[name] = header.value.trim();
    }
  });

  return record;
};
