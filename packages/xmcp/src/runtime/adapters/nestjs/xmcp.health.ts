import { Injectable, Optional } from "@nestjs/common";
import {
  HealthIndicatorService,
  type HealthIndicatorResult,
} from "@nestjs/terminus";
import { XmcpService } from "./xmcp.service";

@Injectable()
export class XmcpHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Optional() private readonly xmcpService?: XmcpService
  ) {}

  async isHealthy(key: string = "xmcp"): Promise<HealthIndicatorResult> {
    const isHealthy = this.xmcpService !== undefined;

    return this.healthIndicatorService.check(key).up({
      status: isHealthy ? "initialized" : "unavailable",
    });
  }
}
