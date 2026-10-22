import { getSupabase } from "@xmcp-dev/supabase";
export default async function myNotes() {
  // RLS, rather than a tool argument, determines which user's rows are visible.
  const { data, error } = await getSupabase()
    .from("notes")
    .select("id, body")
    .limit(20);
  if (error)
    return {
      isError: true,
      content: [{ type: "text", text: "Unable to read notes" }],
    };
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
}
