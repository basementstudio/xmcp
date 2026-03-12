import { fetchExamplesAndTemplates } from "@/app/examples/utils/github";
import { ExampleCards } from "./cards";

export async function ExampleCardsList() {
  const examples = await fetchExamplesAndTemplates();

  return <ExampleCards examples={examples} searchTerm="" />;
}
