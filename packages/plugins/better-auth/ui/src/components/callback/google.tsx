import { useEffect, useState } from "react";

export const GoogleCallback = () => {
  const [message, setMessage] = useState("Processing Google callback...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = `http://127.0.0.1:3002/api/auth/callback/google?${params.toString()}`;

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
        setMessage(
          "Google authentication successful! You may close this window."
        );
        if (data.redirect) {
          window.location.href = data.url;
        }
      })
      .catch((err) => {
        setMessage("Google authentication failed: " + err.message);
      });
  }, []);

  return <div>{message}</div>;
};
