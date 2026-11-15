"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export default function Consent() {
  const [clientId, setClientId] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setClientId(params.get("client_id") ?? "");
    setScopes((params.get("scope") ?? "").split(" ").filter(Boolean));
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="font-bold text-2xl">Authorize access</h1>
      <p>Client {clientId} is requesting:</p>
      <ul>
        {scopes.map((scope) => (
          <li key={scope}>{scope}</li>
        ))}
      </ul>
      <button
        className="bg-white text-black"
        onClick={() => authClient.oauth2.consent({ accept: true })}
      >
        <p>Allow</p>
      </button>
      <button
        className="border-white"
        onClick={() => authClient.oauth2.consent({ accept: false })}
      >
        <p>Deny</p>
      </button>
    </div>
  );
}
