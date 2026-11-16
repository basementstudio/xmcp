import { useEffect, useState } from "react";
import logo from "../../assets/logo.svg";
import { authClient } from "../auth-client";

type ClientDetails = {
  client_id: string;
  client_name?: string;
};

const searchParams = new URLSearchParams(window.location.search);
const clientId = searchParams.get("client_id") ?? "";
const requestedScopes = (searchParams.get("scope") ?? "")
  .split(" ")
  .filter(Boolean);

export const ConsentPage = () => {
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    authClient.oauth2
      .publicClient({ query: { client_id: clientId } })
      .then(({ data, error }) => {
        if (error || !data) {
          setError(error?.message || "Unknown application");
          return;
        }
        setClient(data);
      });
  }, []);

  const respond = async (accept: boolean) => {
    setError(null);
    setIsSubmitting(true);
    const { error } = await authClient.oauth2.consent({ accept });
    if (error) {
      setError(error.message || "Failed to submit your decision");
      setIsSubmitting(false);
    }
  };

  const clientName = client?.client_name || client?.client_id;
  const isDisabled = !client || isSubmitting;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-md w-full space-y-8 flex flex-col items-center">
        <img src={logo} alt="logo" />
        <div className="border border-gray-100 p-8 w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Authorize access</h1>
            <p className="text-base text-gray-400">
              {clientName
                ? `${clientName} wants to access your account`
                : "Loading application details"}
            </p>
          </div>

          {requestedScopes.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">
                Requested permissions
              </p>
              <ul className="space-y-1 text-sm">
                {requestedScopes.map((scope) => (
                  <li key={scope} className="border border-gray-700 px-3 py-2">
                    {scope}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => respond(false)}
              disabled={isDisabled}
              className="w-full border border-white py-3 px-4 font-medium hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase"
            >
              Deny
            </button>
            <button
              type="button"
              onClick={() => respond(true)}
              disabled={isDisabled}
              className="w-full bg-white text-black py-3 px-4 font-medium hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase"
            >
              Allow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
