import { Controller, UseFilters } from "@nestjs/common";
import { XmcpController } from "@xmcp/adapter";
import { McpExceptionFilter } from "./xmcp.filter";

@Controller("mcp")
@UseFilters(McpExceptionFilter)
export class McpController extends XmcpController {}
