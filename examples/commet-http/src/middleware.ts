import { commetProvider } from "@xmcp-dev/commet";

export default commetProvider({
  apiKey: process.env.COMMET_API_KEY!,
  environment: "sandbox",
});
