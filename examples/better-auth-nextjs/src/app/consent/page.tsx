"use client";

import { authClient } from "@/lib/auth-client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function Consent() {
  return (
    <Suspense fallback={<p>Loading authorization request…</p>}>
      <ConsentRequest />
    </Suspense>
  );
}

function ConsentRequest() {
  const params = useSearchParams();
  const clientId = params.get("client_id") ?? "";
  const scopes = (params.get("scope") ?? "").split(" ").filter(Boolean);

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
