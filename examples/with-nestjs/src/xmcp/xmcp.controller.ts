import { Controller, UseFilters } from "@nestjs/common";
import { xmcpController } from "@xmcp/adapter";
import { McpExceptionFilter } from "./xmcp.filter";

@Controller("mcp")
@UseFilters(McpExceptionFilter)
export class McpController extends xmcpController {}
