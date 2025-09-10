"use client";

import { useActionState } from "react";
import { handleSubmit } from "./actions";

const initialState = {
  input: "",
  response: null,
};

export default function Home() {
  const [state, formAction, pending] = useActionState(
    handleSubmit,
    initialState
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <form action={formAction} className="flex flex-col items-center gap-4">
        <input
          name="input"
          type="text"
          placeholder="Enter your prompt..."
          defaultValue={state.input}
          className="border border-black px-4 py-2 w-80"
          required
          disabled={pending}
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-black text-white px-6 py-2 disabled:bg-gray-500"
        >
          {pending ? "Generating..." : "Generate"}
        </button>
      </form>

      <div className="mt-8 w-full max-w-2xl">
        <div className="mb-2 text-center">
          <strong>
            Tool: {state.response?.toolName || "No tool used yet"}
          </strong>
        </div>
        <div className="border border-black h-64 overflow-y-auto p-4">
          <div className="whitespace-pre-wrap text-left">
            {state.response?.output || "No response yet..."}
          </div>
        </div>
      </div>
    </div>
  );
}
