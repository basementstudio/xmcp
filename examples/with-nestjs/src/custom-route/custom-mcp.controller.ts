import {
  XmcpControllerDecorator,
  XmcpController,
} from "@xmcp/adapter";

/**
 * Custom MCP controller with a custom route.
 *
 * By extending XmcpController and applying @XmcpControllerDecorator,
 * you inherit all MCP handling methods while specifying a custom endpoint path.
 *
 * This exposes the MCP endpoint at POST /api/v1/mcp instead of the default /mcp
 */
@XmcpControllerDecorator("api/v1/mcp")
export class CustomMcpController extends XmcpController {}
