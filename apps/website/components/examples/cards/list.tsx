<<<<<<< Updated upstream
import { fetchExamplesAndTemplates } from "../../../utils/github";
=======
import { fetchExamples } from "@/app/examples/utils/github";
>>>>>>> Stashed changes
import { ExampleCards } from "./cards";

export async function ExampleCardsList() {
  const examples = await fetchExamplesAndTemplates();

  return <ExampleCards examples={examples} />;
}
