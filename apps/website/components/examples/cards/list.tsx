import { fetchExamples } from "../../../utils/github";
import { ExampleCards } from "./cards";

export async function ExampleCardsList() {
  const examples = await fetchExamples();

  return <ExampleCards examples={examples} />;
}
