import type { TemplateConfig } from "@/config/schemas";

export interface HttpTransportOptions {
  port?: number;
  host?: string;
  endpoint?: string;
  bodySizeLimit?: string;
  debug?: boolean;
  template?: TemplateConfig;
}

export interface JsonRpcMessage {
  jsonrpc: string;
  method?: string;
  params?: any;
  id?: string | number | null;
  result?: any;
  error?: any;
}
