import { Controller } from "@nestjs/common";

export function XmcpController(route: string = "mcp"): ClassDecorator {
  return Controller(route);
}
