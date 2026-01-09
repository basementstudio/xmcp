import { BetterAuthConfig, EmailAndPassword } from "./types.js";

export interface ResponseConfig {
  providers: {
    emailAndPassword?: EmailAndPassword;
    google?: {
      enabled: boolean;
    };
    /** Indicates custom plugins are configured (e.g., genericOAuth) */
    customPlugins?: {
      enabled: boolean;
    };
  };
}

export function processProvidersResponse(
  providers: BetterAuthConfig["providers"]
) {
  // return a config object for the sign in page so it gets constructed based on the providers configured
  const config: ResponseConfig = {
    providers: {
      ...(providers?.emailAndPassword?.enabled && {
        emailAndPassword: providers?.emailAndPassword, // stuff from email&password can be forwarded
      }),
      ...(providers?.google?.clientSecret &&
        providers?.google?.clientId && {
          google: {
            // google shouldn't forward secret / id
            enabled: true,
          },
        }),
    },
  };

  return config;
}
