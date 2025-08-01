import { useEffect, useState } from "react";
import logo from "../../assets/logo.svg";

const baseUrl = window.location.origin;

export const GoogleCallback = () => {
  const [message, setMessage] = useState("Do not close this window");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = `${baseUrl}/api/auth/callback/google?${params.toString()}`;

    fetch(callbackUrl, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Callback failed");
        }
        return res.json().catch(() => ({}));
      })
      .then((data) => {
        setIsLoading(false);
        setIsError(false);
        setMessage(
          "Google authentication successful! You may close this window."
        );
        if (data.redirect) {
          window.location.href = data.url;
        }
      })
      .catch((err) => {
        setIsLoading(false);
        setIsError(true);
        setMessage("Google authentication failed: " + err.message);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-md w-full space-y-8 flex flex-col items-center">
        <img src={logo} alt="logo" />
        <div className="border border-gray-100 p-8 w-full">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">
              {isLoading
                ? "Completing authentication"
                : isError
                  ? "Authentication failed"
                  : "Authentication successful"}
            </h1>

            {isError ? (
              <div className="bg-red-900/20 border border-red-500 rounded p-4">
                <p className="text-red-400 text-sm">{message}</p>
              </div>
            ) : (
              <p className="text-base text-gray-400">{message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
