import React, { useState } from "react";
import { ResponseConfig } from "../../../../src/utils";
import { EmailForm } from "./email-form";
import { GoogleButton } from "./google-cta";
import logo from "../../assets/logo.svg";

interface DynamicSignInPageProps {
  config: ResponseConfig;
}

export const DynamicSignInPage: React.FC<DynamicSignInPageProps> = ({
  config,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const hasEmailAndPassword = config.providers.emailAndPassword?.enabled;
  const hasGoogle = config.providers.google?.enabled;
  const hasMultipleProviders = hasEmailAndPassword && hasGoogle;

  const getPageTitle = () => {
    if (hasGoogle && !hasEmailAndPassword) {
      return "Sign in with Google";
    }
    return "Welcome back";
  };

  const getPageDescription = () => {
    if (hasGoogle && !hasEmailAndPassword) {
      return "Use your Google account to sign in";
    }
    return "Sign in to your account";
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-md w-full space-y-8 flex flex-col items-center">
        <img src={logo} alt="logo" />
        <div className="border border-gray-100 p-8 w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">{getPageTitle()}</h1>
            <p className="text-base text-gray-400">{getPageDescription()}</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {hasEmailAndPassword && config.providers.emailAndPassword && (
              <EmailForm
                config={config.providers.emailAndPassword}
                setError={setError}
                isLoading={isEmailLoading}
                setIsLoading={setIsEmailLoading}
                isDisabled={isGoogleLoading}
              />
            )}

            {hasMultipleProviders && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-400"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-black text-gray-400">or</span>
                </div>
              </div>
            )}

            {hasGoogle && (
              <GoogleButton
                setError={setError}
                isLoading={isGoogleLoading}
                setIsLoading={setIsGoogleLoading}
                isDisabled={isEmailLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
