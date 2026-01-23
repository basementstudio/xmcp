import { Controller, Get, Options, Req, Res, Header } from "@nestjs/common";
import { Request, Response } from "express";
import { OAuthService } from "./xmcp.oauth.service";

@Controller(".well-known")
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get(["oauth-protected-resource", "oauth-protected-resource/*path"])
  @Header("Content-Type", "application/json")
  @Header("Access-Control-Allow-Origin", "*")
  @Header("Access-Control-Allow-Methods", "GET, OPTIONS")
  @Header("Access-Control-Allow-Headers", "*")
  @Header("Cache-Control", "public, max-age=3600")
  getResourceMetadata(@Req() req: Request) {
    return this.oauthService.getResourceMetadata(req);
  }

  @Options(["oauth-protected-resource", "oauth-protected-resource/*path"])
  @Header("Access-Control-Allow-Origin", "*")
  @Header("Access-Control-Allow-Methods", "GET, OPTIONS")
  @Header("Access-Control-Allow-Headers", "*")
  @Header("Access-Control-Max-Age", "86400")
  handleOptions(@Res() res: Response) {
    res.status(204).send();
  }
}
