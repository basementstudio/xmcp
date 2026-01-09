import type { BetterAuthPlugin } from "better-auth";
import { Database } from "./databases.js";

// Extracted from better-auth types
export type EmailAndPassword = {
  /**
   * Enable email and password authentication
   *
   * @default false
   */
  enabled: boolean;
  /**
   * Disable email and password sign up
   *
   * @default false
   */
  disableSignUp?: boolean;
  /**
   * Require email verification before a session
   * can be created for the user.
   *
   * if the user is not verified, the user will not be able to sign in
   * and on sign in attempts, the user will be prompted to verify their email.
   */
  //requireEmailVerification?: boolean;
  /**
   * The maximum length of the password.
   *
   * @default 128
   */
  maxPasswordLength?: number;
  /**
   * The minimum length of the password.
   *
   * @default 8
   */
  minPasswordLength?: number;
  /**
   * send reset password
   */
  //sendResetPassword?: (
  /**
   * @param user the user to send the
   * reset password email to
   * @param url the URL to send the reset password email to
   * @param token the token to send to the user (could be used instead of sending the url
   * if you need to redirect the user to custom route)
   */
  /*data: {
      user: User;
      url: string;
      token: string;
    },
    /**
     * The request object
     */
  //request?: Request
  //) => Promise<void>;

  /**
   * Number of seconds the reset password token is
   * valid for.
   * @default 1 hour (60 * 60)
   */
  //resetPasswordTokenExpiresIn?: number;
  /**
   * A callback function that is triggered
   * when a user's password is changed successfully.
   */
  /* onPasswordReset?: (
    data: {
      user: User;
    },
    request?: Request
  ) => Promise<void>; */
  /**
   * Password hashing and verification
   *
   * By default Scrypt is used for password hashing and
   * verification. You can provide your own hashing and
   * verification function. if you want to use a
   * different algorithm.
   */
  password?: {
    hash?: (password: string) => Promise<string>;
    verify?: (data: { hash: string; password: string }) => Promise<boolean>;
  };
  /**
   * Automatically sign in the user after sign up
   *
   * @default true
   */
  //autoSignIn?: boolean;
  /**
   * Whether to revoke all other sessions when resetting password
   * @default false
   */
  //revokeSessionsOnPasswordReset?: boolean;
};

export type BetterAuthConfig = {
  database: Database;
  baseURL: string;
  secret: string;
  providers?: {
    emailAndPassword?: EmailAndPassword;
    google?: {
      clientId: string;
      clientSecret: string;
    };
  };
  /**
   * Custom Better Auth plugins to include.
   *
   * Use this to add your own OAuth providers (via genericOAuth) or other
   * Better Auth plugins while keeping the sign-in UI, middleware, and
   * session management provided by this wrapper.
   *
   * The MCP plugin is always included automatically.
   *
   * @example
   * ```typescript
   * import { genericOAuth } from 'better-auth/plugins/generic-oauth';
   *
   * // Create custom OAuth provider with full control
   * const googleOAuth = genericOAuth({
   *   config: [{
   *     providerId: 'google',
   *     clientId: process.env.GOOGLE_CLIENT_ID,
   *     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
   *     authorizationUrl: 'https://sso-proxy.example.com/proxy/https://accounts.google.com/o/oauth2/v2/auth',
   *     tokenUrl: 'https://oauth2.googleapis.com/token',
   *     userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
   *     scopes: ['openid', 'email', 'profile'],
   *     pkce: true,
   *   }],
   * });
   *
   * betterAuthProvider({
   *   database: pool,
   *   baseURL: '...',
   *   secret: '...',
   *   plugins: [googleOAuth],
   * });
   * ```
   */
  plugins?: BetterAuthPlugin[];
};
