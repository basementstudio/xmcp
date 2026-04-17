export interface McpClientInfo {
  /** MCP client implementation name from initialize.params.clientInfo.name */
  name: string;
  /** MCP client implementation version from initialize.params.clientInfo.version */
  version: string;
  /** Optional human-friendly title from initialize.params.clientInfo.title */
  title?: string;
  /** Optional website URL from initialize.params.clientInfo.websiteUrl */
  websiteUrl?: string;
  /** Optional description from initialize.params.clientInfo.description */
  description?: string;
}
