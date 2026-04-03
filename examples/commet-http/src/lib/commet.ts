import { CommetProvider } from "@xmcp-dev/commet";

export const commet = CommetProvider.getInstance({
  apiKey: process.env.COMMET_API_KEY!,
  environment: "sandbox",
});
