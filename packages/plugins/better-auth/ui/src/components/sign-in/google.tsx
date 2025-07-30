import React from "react";
import { authClient } from "../auth-client";

export const SignInPage: React.FC = () => {
  const session = authClient.useSession();

  const handleSignIn = async () => {
    const { error } = await authClient.signIn.social({
      provider: "google",
    });
    if (error) {
      console.error("[SignInPage] SignIn error:", error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      console.error("[SignInPage] SignOut error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Debug session info - remove this in production */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 font-mono">
            {JSON.stringify({ session }, null, 2)}
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Sign in with Google
            </h1>
            <p className="text-gray-600 text-sm">
              Use your Google account to sign in
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <button
              type="button"
              onClick={handleSignIn}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path
                    d="M44.5 20H24V28.5H36.9C35.5 32.5 31.9 35 27.5 35C21.7 35 17 30.3 17 24.5C17 18.7 21.7 14 27.5 14C30.1 14 32.4 15 34.1 16.7L39.1 11.7C36.2 8.9 32.1 7 27.5 7C16.7 7 8 15.7 8 26.5C8 37.3 16.7 46 27.5 46C37.1 46 45 38.1 45 28.5C45 27.3 44.9 26.2 44.7 25.1L44.5 20Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M6.3 14.7L12.1 19.1C13.9 15.6 17.4 13 21.7 13C24.1 13 26.3 13.8 28.1 15.1L33.1 10.1C30.1 7.7 26.1 6 21.7 6C14.1 6 7.7 10.9 6.3 14.7Z"
                    fill="#34A853"
                  />
                  <path
                    d="M21.7 46C26.1 46 30.1 44.3 33.1 41.9L28.1 36.9C26.3 38.2 24.1 39 21.7 39C17.4 39 13.9 36.4 12.1 32.9L6.3 37.3C7.7 41.1 14.1 46 21.7 46Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M44.5 20H24V28.5H36.9C36.3 30.2 35.2 31.7 33.7 32.7L39.1 37.1C41.7 34.7 43.5 31.2 44.5 27.5V20Z"
                    fill="#EA4335"
                  />
                </g>
              </svg>
              Sign in with Google
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full bg-white text-gray-700 py-3 px-4 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
