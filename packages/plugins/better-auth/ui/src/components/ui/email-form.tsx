import React, { useState } from "react";
import { authClient } from "../auth-client";
import { EmailAndPassword } from "../../../../src/types";

interface EmailFormProps {
  config: EmailAndPassword;
  setError: (error: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const EmailForm: React.FC<EmailFormProps> = ({
  config,
  setError,
  isLoading,
  setIsLoading,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });
      if (error) {
        setError(
          error.message ||
            "Failed to sign in. Please check your credentials and try again."
        );
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email,
        name,
        password,
      });
      if (error) {
        setError(
          error.message || "Failed to create account. Please try again."
        );
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const isSignUpDisabled = config.disableSignUp;

  return (
    <>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {isSignUpMode && (
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium mb-2 uppercase text-white"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError();
              }}
              className="w-full px-4 py-3 border border-white focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm"
              placeholder="Enter your full name"
              required
              disabled={isLoading}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium mb-2 uppercase text-white"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError();
            }}
            className="w-full px-4 py-3 border border-white focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm"
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>

        <div className="mb-2">
          <label
            htmlFor="password"
            className="block text-xs font-medium mb-2 uppercase text-white"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError();
            }}
            className="w-full px-4 py-3 border border-white focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm"
            placeholder="Enter your password"
            required
            disabled={isLoading}
            minLength={config.minPasswordLength}
            maxLength={config.maxPasswordLength}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={isSignUpMode ? handleSignUp : handleSignIn}
            disabled={isLoading}
            className="w-full bg-white text-black py-3 px-4 font-medium hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isSignUpMode ? "Creating Account..." : "Signing In..."}
              </span>
            ) : isSignUpMode ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </div>
      </form>

      {!isSignUpDisabled && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {isSignUpMode
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              onClick={toggleMode}
              disabled={isLoading}
              className="font-medium text-white hover:underline bg-transparent border-none cursor-pointer focus-visible:ring-2 focus-visible:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignUpMode ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      )}
    </>
  );
};
