import { useEffect, useState } from "react";
import { ResponseConfig } from "../../../../src/utils";
import { DynamicSignInPage } from "../ui/sign-in-page";

const SignInPage = () => {
  const [config, setConfig] = useState<ResponseConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/auth/config")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load configuration");
        }
        return response.json();
      })
      .then((config) => {
        setConfig(config);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load configuration");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-4 py-2 rounded hover:bg-gray-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-400">No authentication providers configured</p>
        </div>
      </div>
    );
  }

  return <DynamicSignInPage config={config} />;
};

export { SignInPage };
